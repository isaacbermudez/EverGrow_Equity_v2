# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, time, os
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app)

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "YOUR_FINNHUB_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "YOUR_OPENROUTER_API_KEY_HERE")
ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "YOUR_ALPHA_VANTAGE_API_KEY") # New API Key

DEEPDIVE_SYSTEM_PROMPT = """
Actúa como DeepDive Stocks, un analista de empresas para inversión. Tu tarea es realizar un análisis profesional, exhaustivo y estratégico en español para inversores avanzados. Usa navegación web si está disponible. Evalúa modelo de negocio, noticias recientes, directiva, sector, resiliencia, posición en el mercado, si la empresa es Blue Chip o Multibagger, explicación de variación reciente del precio y el valor intrínseco estimado. Usa tablas con esta estructura exacta para los siguientes bloques:

💰 Rentabilidad
| Indicador    | Meta / Esperado     | Cumple |
|--------------|---------------------|--------|
| Net Income   | Estable o creciente |        |
| Net Margin   | > 15%               |        |
| ROE          | > 15%               |        |
| ROA          | > 15%               |        |
| ROIC         | > 20%               |        |

📈 Crecimiento
| Indicador         | Meta / Esperado     | Cumple |
|-------------------|---------------------|--------|
| Revenue (Ingresos) | Estable o creciente |        |
| EPS Growth (5 años) | Positivo            |        |
| Sales Growth (5 años) | > 10%             |        |
| Long-Term EPS Growth | Positivo          |        |

📊 Valuación
| Indicador  | Meta / Esperado | Cumple |
|------------|-----------------|--------|
| P/E Ratio  | < 20 (o < 25)   |        |
| PEG Ratio  | < 1             |        |
| P/B Ratio  | < 2             |        |

🧮 Solidez Financiera (Deuda y Liquidez)
| Indicador       | Meta / Esperado | Cumple |
|------------------|-----------------|--------|
| Net Debt / EBITDA | < 3x           |        |
| Debt/Equity      | < 1             |        |
| Quick Ratio      | > 1             |        |

💸 Dividendos
| Indicador      | Meta / Esperado | Cumple |
|----------------|-----------------|--------|
| Dividend Yield | > 0% (si aplica) |        |
| Payout Ratio   | < 60%           |        |

Luego asigna un color de semáforo (Verde, Amarillo o Rojo) con justificación clara. Sugiere el perfil de inversor ideal (crecimiento, valor, dividendos, conservador o agresivo) y tipo de inversión (largo/corto plazo). Si hay más de una empresa, haz una comparativa y concluye cuál es más atractiva. Incluye resumen del desempeño en 5 años. Finaliza con 'Fuentes y Fecha de Consulta' con hipervínculos. No uses datos ficticios ni des recomendaciones explícitas. Sé claro, directo y profesional.
"""

print(f"FINNHUB_API_KEY loaded: {FINNHUB_API_KEY}")
print(f"OPENROUTER_API_KEY loaded: {'*****' if OPENROUTER_API_KEY else 'NOT_SET'}")
print(f"ALPHA_VANTAGE_API_KEY loaded: {'*****' if ALPHA_VANTAGE_API_KEY else 'NOT_SET'}") # New print

RATE_LIMIT = 60
CACHE_TTL_QUOTE = 60
CACHE_TTL_NEWS = 300
MARKET_STATUS_CACHE_TTL = 300
CACHE_TTL_COMPANY_PROFILE = 86400
CACHE_TTL_BASIC_FINANCIALS = 3600 # Still used for Alpha Vantage data now
CACHE_TTL_ALPHA_VANTAGE_FINANCIALS = 86400 # Alpha Vantage fundamental data is less frequent, cache for 24 hours
CACHE_TTL_CHAT = 3600

request_timestamps = []
quote_cache = {}
market_status_cache = {}
news_cache = {}
company_profile_cache = {}
basic_financials_cache = {} # This will now store Alpha Vantage data
chat_cache = {}

# Alpha Vantage specific rate limit tracking
alpha_vantage_timestamps = []
ALPHA_VANTAGE_RATE_LIMIT = 5 # 5 calls per minute for free tier

def check_global_rate_limit():
    now = time.time()
    global request_timestamps
    request_timestamps = [t for t in request_timestamps if now - t < 60]
    if len(request_timestamps) >= RATE_LIMIT:
        raise RuntimeError("Global rate limit exceeded. Please wait a moment and try again.")
    request_timestamps.append(now)

def check_alpha_vantage_rate_limit():
    now = time.time()
    global alpha_vantage_timestamps
    alpha_vantage_timestamps = [t for t in alpha_vantage_timestamps if now - t < 60]
    if len(alpha_vantage_timestamps) >= ALPHA_VANTAGE_RATE_LIMIT:
        raise RuntimeError("Alpha Vantage rate limit exceeded (5 calls per minute). Please wait a moment and try again.")
    alpha_vantage_timestamps.append(now)

def get_quote(symbol):
    now = time.time()
    if symbol in quote_cache:
        ts, data = quote_cache[symbol]
        if now - ts < CACHE_TTL_QUOTE:
            return data

    check_global_rate_limit() # Use global rate limit for Finnhub quotes

    url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={FINNHUB_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    quote_cache[symbol] = (now, data)
    return data

@app.route("/api/analyze-portfolio", methods=["POST"])
def analyze_portfolio():
    # Expect the new top-level JSON structure
    full_data = request.get_json()
    
    # Check if JSON data was successfully parsed
    if full_data is None:
        return jsonify({"error": "No JSON data received or invalid JSON format in request body. Ensure Content-Type is application/json."}), 400

    if not isinstance(full_data, dict):
        return jsonify({"error": "Invalid top-level JSON format. Expecting a dictionary with 'Assets', 'Transactions', 'Deposits'."}), 400

    assets = full_data.get("Assets", [])
    transactions = full_data.get("Transactions", [])
    deposits = full_data.get("Deposits", [])

    if not isinstance(assets, list):
        return jsonify({"error": "Invalid 'Assets' format. The 'Assets' key must contain a list."}), 400

    results = []
    for item in assets:
        # Prioritize "Symbol" then "Ticker" for stock symbol
        sym = item.get("Symbol") or item.get("Ticker")
        # Prioritize "CI" then "cost_basis" for cost incurred
        ci  = item.get("CI")     or item.get("cost_basis", 0) 
        # Prioritize "Holdings" then "holdings" for quantity
        qty = item.get("Holdings") or item.get("holdings", 0)
        
        # Default to "N/A" if Sector or Category are not found
        sector = item.get("Sector") or item.get("sector", "N/A")
        category = item.get("Category") or item.get("category", "N/A")

        if not sym:
            print(f"Skipping asset due to missing symbol: {item}")
            continue

        try:
            q = get_quote(sym)
            current = q.get("c") or 0.0
        except RuntimeError as e:
            # Log rate limit specific errors, but continue processing other assets
            print(f"Rate limit hit for quote for {sym}: {e}")
            current = 0.0 
        except Exception as e:
            print(f"Error fetching quote for {sym}: {e}")
            current = 0.0

        market_value = current * qty
        pl            = market_value - ci
        pl_pct        = (pl / ci * 100) if ci else None

        results.append({
            "symbol": sym,
            "holdings": qty,
            "CI": ci,
            "currentPrice": current,
            "marketValue": market_value,
            "profitLoss": round(pl, 2),
            "profitLossPct": round(pl_pct,2) if pl_pct is not None else None,
            "sector": sector,
            "category": category
        })
    
    # Return the processed asset results. Acknowledge receipt of other data.
    # The frontend can use 'asset_results' for display and can ignore 'transactions_received' and 'deposits_received' for now.
    return jsonify({
        "asset_results": results,
        "transactions_received": len(transactions),
        "deposits_received": len(deposits)
    })

@app.route("/api/market-status", methods=["GET"])
def get_market_status():
    exchange = request.args.get("exchange", "US")
    now = time.time()

    if exchange in market_status_cache:
        ts, data = market_status_cache[exchange]
        if now - ts < MARKET_STATUS_CACHE_TTL:
            return jsonify(data)

    try:
        check_global_rate_limit() # Use global rate limit for Finnhub

        url = f"https://finnhub.io/api/v1/market/status?exchange={exchange}&token={FINNHUB_API_KEY}"
        resp = requests.get(url)
        resp.raise_for_status()

        response_text = resp.text
        data = resp.json()
        market_status_cache[exchange] = (now, data)
        return jsonify(data)
    except RuntimeError as e:
        print(f"Rate limit exceeded for Finnhub API: {e}")
        return jsonify({"error": str(e)}), 429
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error from Finnhub Market Status: {e}. Raw response: '{response_text}'")
        return jsonify({"error": f"Failed to parse Finnhub response as JSON. Error: {e}"}), 500
    except requests.exceptions.RequestException as e:
        print(f"Request Exception to Finnhub Market Status: {e}")
        return jsonify({"error": f"Failed to connect to Finnhub API: {e}"}), 500
    except Exception as e:
        print(f"An unexpected error occurred in get_market_status: {e}")
        return jsonify({"error": f"An unexpected server error occurred: {e}"}), 500

@app.route("/api/company-news", methods=["GET"])
def get_company_news():
    symbol = request.args.get("symbol")
    today = datetime.now().strftime('%Y-%m-%d')
    thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    from_date = request.args.get("from", thirty_days_ago)
    to_date = request.args.get("to", today)

    if not symbol:
        return jsonify({"error": "Symbol is required."}), 400

    cache_key = f"{symbol}-{from_date}-{to_date}"
    now = time.time()

    if cache_key in news_cache:
        ts, data = news_cache[cache_key]
        if now - ts < CACHE_TTL_NEWS:
            return jsonify(data)

    try:
        check_global_rate_limit() # Use global rate limit for Finnhub

        url = f"https://finnhub.io/api/v1/company-news?symbol={symbol}&from={from_date}&to={to_date}&token={FINNHUB_API_KEY}"
        resp = requests.get(url)
        resp.raise_for_status()

        response_text = resp.text
        data = resp.json()
        news_cache[cache_key] = (now, data)
        return jsonify(data)
    except RuntimeError as e:
        print(f"Rate limit exceeded for Finnhub News API: {e}")
        return jsonify({"error": str(e)}), 429
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error from Finnhub News API for {symbol}: {e}. Raw response: '{response_text}'")
        return jsonify({"error": f"Failed to parse Finnhub news response for {symbol} as JSON. Error: {e}"}), 500
    except requests.exceptions.RequestException as e:
        print(f"Request Exception to Finnhub News API for {symbol}: {e}")
        return jsonify({"error": f"Failed to connect to Finnhub News API for {symbol}: {e}"}), 500
    except Exception as e:
        print(f"An unexpected error occurred in get_company_news for {symbol}: {e}")
        return jsonify({"error": f"An unexpected server error occurred for {symbol}: {e}"}), 500

def get_company_news_from_backend(symbol, from_date=None, to_date=None):
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        from_date = from_date or (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        to_date = to_date or today

        url = f"https://finnhub.io/api/v1/company-news?symbol={symbol}&from={from_date}&to={to_date}&token={FINNHUB_API_KEY}"
        resp = requests.get(url)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"error": str(e)}

def get_fundamentals_from_backend(symbol):
    try:
        url = f"https://finnhub.io/api/v1/stock/metric?symbol={symbol}&metric=all&token={FINNHUB_API_KEY}"
        resp = requests.get(url)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"error": str(e)}

# Replaced get_basic_financials_from_backend with Alpha Vantage logic
def get_alpha_vantage_financial_data(symbol, function_type):
    """
    Fetches fundamental financial data from Alpha Vantage.
    function_type can be 'INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW', 'OVERVIEW'.
    """
    if not ALPHA_VANTAGE_API_KEY or ALPHA_VANTAGE_API_KEY == "YOUR_ALPHA_VANTAGE_API_KEY":
        return {"error": "ALPHA_VANTAGE_API_KEY is not set correctly in your environment variables."}

    check_alpha_vantage_rate_limit() # Use Alpha Vantage specific rate limit

    url = f"https://www.alphavantage.co/query?function={function_type}&symbol={symbol}&apikey={ALPHA_VANTAGE_API_KEY}"
    response_text = ""
    try:
        resp = requests.get(url)
        resp.raise_for_status()
        response_text = resp.text

        data = resp.json()

        # Alpha Vantage often returns {"Information": "..."} for rate limits or invalid keys
        if "Information" in data and "rate limit" in data["Information"].lower():
            return {"error": f"Alpha Vantage Rate Limit Exceeded: {data['Information']}"}
        if "Error Message" in data:
            return {"error": f"Alpha Vantage API Error for {function_type} - {symbol}: {data['Error Message']}"}
        if not data or not any(key in data for key in ["annualReports", "quarterlyReports", "Symbol", "AssetType"]):
            # Check for expected keys, 'Symbol' and 'AssetType' for OVERVIEW, reports for financials
            return {"error": f"No {function_type.replace('_', ' ').lower()} data found for symbol: {symbol}. Raw response: {response_text}"}

        return data
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error from Alpha Vantage ({function_type}) for {symbol}: {e}. Raw response: '{response_text}'")
        return {"error": f"Failed to parse Alpha Vantage response for {function_type} as JSON for {symbol}. Error: {e}. Raw: {response_text[:200]}..."}
    except requests.exceptions.RequestException as e:
        print(f"Request Exception to Alpha Vantage ({function_type}) API for {symbol}: {e}. URL: {url}")
        if hasattr(e, 'response') and e.response is not None:
            return {"error": f"HTTP error {e.response.status_code} from Alpha Vantage ({function_type}) API: {e.response.text}"}
        return {"error": f"Failed to connect to Alpha Vantage ({function_type}) API for {symbol}: {e}"}
    except Exception as e:
        print(f"An unexpected error occurred in get_alpha_vantage_financial_data for {symbol} ({function_type}): {e}")
        return {"error": f"An unexpected server error occurred while fetching {function_type} from Alpha Vantage: {e}"}


@app.route("/api/company-profile", methods=["GET"])
def get_company_profile():
    symbol = request.args.get("symbol")
    if not symbol:
        return jsonify({"error": "Symbol is required."}), 400

    now = time.time()
    if symbol in company_profile_cache:
        ts, data = company_profile_cache[symbol]
        if now - ts < CACHE_TTL_COMPANY_PROFILE:
            return jsonify(data)

    try:
        check_global_rate_limit() # Use global rate limit for Finnhub
        url = f"https://finnhub.io/api/v1/stock/profile2?symbol={symbol}&token={FINNHUB_API_KEY}"
        resp = requests.get(url)
        resp.raise_for_status()
        data = resp.json()
        if not data:
            return jsonify({"error": f"No company profile found for symbol: {symbol}"}), 404
        company_profile_cache[symbol] = (now, data)
        return jsonify(data)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 429
    except Exception as e:
        print(f"Error fetching company profile for {symbol}: {e}")
        return jsonify({"error": f"Failed to fetch company profile for {symbol}: {e}"}), 500

@app.route("/api/stock-metrics", methods=["GET"])
def get_stock_metrics_api():
    symbol = request.args.get("symbol")
    if not symbol:
        return jsonify({"error": "Symbol is required."}), 400

    try:
        check_global_rate_limit() # Use global rate limit for Finnhub
        data = get_fundamentals_from_backend(symbol)
        if "error" in data:
            return jsonify(data), 500
        if not data or not data.get("metric"):
             return jsonify({"error": f"No fundamental metrics found for symbol: {symbol}"}), 404
        return jsonify(data)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 429
    except Exception as e:
        print(f"Error in get_stock_metrics_api for {symbol}: {e}")
        return jsonify({"error": f"Failed to fetch fundamental metrics for {symbol}: {e}"}), 500

# Updated Endpoint for Basic Financials to use Alpha Vantage
@app.route("/api/basic-financials", methods=["GET"])
def get_basic_financials_api():
    symbol = request.args.get("symbol")
    # metricType for Alpha Vantage will map to different functions:
    # 'overview', 'incomeStatement', 'balanceSheet', 'cashFlow'
    metric_type = request.args.get("metricType", "overview") # Default to 'overview'

    if not symbol:
        return jsonify({"error": "Symbol is required."}), 400

    # Map request metric_type to Alpha Vantage FUNCTION
    alpha_vantage_function = None
    if metric_type.lower() == 'overview':
        alpha_vantage_function = 'OVERVIEW'
    elif metric_type.lower() == 'incomestatement':
        alpha_vantage_function = 'INCOME_STATEMENT'
    elif metric_type.lower() == 'balancesheet':
        alpha_vantage_function = 'BALANCE_SHEET'
    elif metric_type.lower() == 'cashflow':
        alpha_vantage_function = 'CASH_FLOW'
    else:
        return jsonify({"error": f"Invalid metricType: {metric_type}. Supported: overview, incomeStatement, balanceSheet, cashFlow."}), 400

    cache_key = f"{symbol}-{alpha_vantage_function}"
    now = time.time()

    if cache_key in basic_financials_cache:
        ts, data = basic_financials_cache[cache_key]
        if now - ts < CACHE_TTL_ALPHA_VANTAGE_FINANCIALS:
            return jsonify(data)

    try:
        data = get_alpha_vantage_financial_data(symbol, alpha_vantage_function)

        if "error" in data:
            # Alpha Vantage API errors often contain "Note: ..." or "Error Message"
            if "Rate Limit Exceeded" in data["error"]:
                return jsonify(data), 429 # Too Many Requests
            elif "invalid API key" in data["error"].lower() or "not a valid" in data["error"].lower():
                return jsonify(data), 401 # Unauthorized
            elif "symbol" in data["error"].lower() and ("invalid" in data["error"].lower() or "not found" in data["error"].lower()):
                return jsonify(data), 404 # Not Found
            else:
                return jsonify(data), 500 # Generic server error for unhandled helper errors

        # Alpha Vantage returns an empty object {} or a message if no data is found for the symbol
        if not data:
            return jsonify({"error": f"No data returned from Alpha Vantage for {symbol} ({metric_type})."}), 404

        basic_financials_cache[cache_key] = (now, data)
        return jsonify(data)
    except RuntimeError as e: # Catch local rate limit from check_alpha_vantage_rate_limit
        return jsonify({"error": str(e)}), 429
    except Exception as e:
        print(f"Error in get_basic_financials_api for {symbol} ({metric_type}): {e}")
        return jsonify({"error": f"An unexpected server error occurred in the API endpoint for {symbol}: {e}"}), 500


@app.route("/api/chat", methods=["POST"])
def chat_with_gpt():
    try:
        data = request.get_json()
        user_message = data.get("message")
        conversation_history = data.get("history", [])

        if not user_message:
            return jsonify({"error": "Message is required."}), 400

        messages_payload = [
            {"role": "system", "content": DEEPDIVE_SYSTEM_PROMPT.strip()},
            *conversation_history,
            {"role": "user", "content": user_message.strip()}
        ]

        tool_definitions = [
            {
                "type": "function",
                "function": {
                    "name": "get_stock_quote",
                    "description": "Obtiene el precio de cotización actual de la acción desde Finnhub.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "symbol": { "type": "string", "description": "Símbolo bursátil, por ejemplo: NVO" }
                        },
                        "required": ["symbol"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_company_news",
                    "description": "Obtiene noticias recientes de una empresa con su símbolo.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "symbol": { "type": "string" },
                            "from_date": { "type": "string" },
                            "to_date": { "type": "string" }
                        },
                        "required": ["symbol"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_fundamentals",
                    "description": "Obtiene métricas fundamentales de una empresa (desde Finnhub).", # Updated description
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "symbol": { "type": "string" }
                        },
                        "required": ["symbol"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_basic_financials",
                    "description": "Obtiene datos financieros básicos de una empresa, incluyendo información general, estado de resultados, balance general o estado de flujo de efectivo (desde Alpha Vantage).", # Updated description
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "symbol": { "type": "string", "description": "Símbolo bursátil de la empresa." },
                            "metric_type": {
                                "type": "string",
                                "description": "Tipo de dato financiero a obtener. Puede ser 'overview' (información general y métricas clave), 'incomeStatement' (estado de resultados), 'balanceSheet' (balance general) o 'cashFlow' (estado de flujo de efectivo). Por defecto es 'overview'.",
                                "enum": ["overview", "incomeStatement", "balanceSheet", "cashFlow"]
                            }
                        },
                        "required": ["symbol"]
                    }
                }
            }
        ]

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": "deepseek/deepseek-chat-v3-0324",
            "messages": messages_payload,
            "tools": tool_definitions,
            "tool_choice": "auto"
        }

        openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        resp = requests.post(openrouter_url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

        if "choices" not in data or not data["choices"]:
            return jsonify({"error": f"Unexpected response from OpenRouter: {json.dumps(data, indent=2)}"}), 500

        message = data["choices"][0]["message"]

        if "tool_calls" in message:
            tool_outputs = []
            for tool_call in message["tool_calls"]:
                fn_name = tool_call["function"]["name"]
                args = json.loads(tool_call["function"]["arguments"])

                result = {"error": f"Unknown tool: {fn_name}"}

                try:
                    if fn_name == "get_stock_quote":
                        result = get_quote(args["symbol"])
                    elif fn_name == "get_company_news":
                        result = get_company_news_from_backend(args["symbol"], args.get("from_date"), args.get("to_date"))
                    elif fn_name == "get_fundamentals":
                        result = get_fundamentals_from_backend(args["symbol"])
                    elif fn_name == "get_basic_financials":
                        # Call Alpha Vantage helper function
                        result = get_alpha_vantage_financial_data(args["symbol"], args.get("metric_type", "OVERVIEW").upper())
                except RuntimeError as e:
                    result = {"error": str(e)}
                except Exception as e:
                    result = {"error": f"Error executing tool '{fn_name}': {e}"}

                tool_outputs.append({
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "name": fn_name,
                    "content": json.dumps(result)
                })

            followup_payload = {
                "model": "deepseek/deepseek-chat-v3-0324",
                "messages": messages_payload + [message] + tool_outputs
            }

            followup_resp = requests.post(openrouter_url, headers=headers, json=followup_payload)
            followup_resp.raise_for_status()
            final_message = followup_resp.json()["choices"][0]["message"]["content"]

            return jsonify({"response": final_message})

        return jsonify({"response": message["content"]})

    except Exception as e:
        print(f"Error in chat_with_gpt: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    if not OPENROUTER_API_KEY or OPENROUTER_API_KEY == "YOUR_OPENROUTER_API_KEY_HERE":
        print("WARNING: OPENROUTER_API_KEY is not set or is default. AI chat features may fail.")
    if not FINNHUB_API_KEY or FINNHUB_API_KEY == "YOUR_API_KEY":
        print("WARNING: FINNHUB_API_KEY is not set or is default. Stock data features may not work.")
    if not ALPHA_VANTAGE_API_KEY or ALPHA_VANTAGE_API_KEY == "YOUR_ALPHA_VANTAGE_API_KEY":
        print("WARNING: ALPHA_VANTAGE_API_KEY is not set or is default. Alpha Vantage features may not work.")
    app.run(debug=True, port=5000)