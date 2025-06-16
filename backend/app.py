from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, time, os
import json # Import json for specific JSONDecodeError
# from openai import OpenAI # <--- We won't use the OpenAI client for this specific call
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "YOUR_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "YOUR_OPENROUTER_API_KEY_HERE")
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

# The OpenAI client is no longer needed for direct OpenRouter calls if you want header access
# openrouter_client = OpenAI(
#     api_key=OPENROUTER_API_KEY,
#     base_url="https://openrouter.ai/api/v1"
# )

print(f"FINNHUB_API_KEY loaded: {FINNHUB_API_KEY}")
print(f"OPENROUTER_API_KEY loaded: {'*****' if OPENROUTER_API_KEY else 'NOT_SET'}") 


RATE_LIMIT = 60         # max calls / minute for your Flask backend to Finnhub
CACHE_TTL_QUOTE = 60    # seconds for stock quotes
CACHE_TTL_NEWS = 300    # seconds (5 minutes for news)
MARKET_STATUS_CACHE_TTL = 300 # seconds (5 minutes for market status)

request_timestamps = []
quote_cache = {}
market_status_cache = {}
news_cache = {} 
chat_cache = {}
CACHE_TTL_CHAT = 3600 

def check_rate_limit():
    now = time.time()
    global request_timestamps
    request_timestamps = [t for t in request_timestamps if now - t < 60]
    if len(request_timestamps) >= RATE_LIMIT:
        raise RuntimeError("Rate limit exceeded")
    request_timestamps.append(now)

def get_quote(symbol):
    now = time.time()
    if symbol in quote_cache:
        ts, data = quote_cache[symbol]
        if now - ts < CACHE_TTL_QUOTE:
            return data
    
    check_rate_limit()
    
    url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={FINNHUB_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    quote_cache[symbol] = (now, data)
    return data

@app.route("/api/analyze-portfolio", methods=["POST"])
def analyze_portfolio():
    assets = request.get_json()
    if not isinstance(assets, list):
        return jsonify({"error": "Invalid format. Expecting a list of asset objects."}), 400

    results = []
    for item in assets:
        sym = item.get("Symbol") or item.get("symbol")
        ci  = item.get("CI")     or item.get("ci", 0)
        qty = item.get("Holdings") or item.get("holdings", 0)
        sector = item.get("Sector") or item.get("sector", "N/A")
        category = item.get("Category") or item.get("category", "N/A")

        if not sym:
            continue

        try:
            q = get_quote(sym)
            current = q.get("c") or 0.0
        except RuntimeError as e:
            return jsonify({"error": str(e)}), 429
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
    return jsonify({"results": results})

@app.route("/api/market-status", methods=["GET"])
def get_market_status():
    exchange = request.args.get("exchange", "US")
    now = time.time()

    if exchange in market_status_cache:
        ts, data = market_status_cache[exchange]
        if now - ts < MARKET_STATUS_CACHE_TTL:
            return jsonify(data)
    
    try:
        check_rate_limit()
        
        url = f"https://finnhub.io/api/v1/market/status?exchange={exchange}&token={FINNHUB_API_KEY}"
        resp = requests.get(url)
        resp.raise_for_status()

        response_text = resp.text
        # print(f"Finnhub Market Status raw response: {response_text[:500]}...")

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
    # Default to 30 days ago for 'from' and today for 'to'
    today = datetime.now().strftime('%Y-%m-%d')
    thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    from_date = request.args.get("from", thirty_days_ago)
    to_date = request.args.get("to", today)

    if not symbol:
        return jsonify({"error": "Symbol is required."}), 400

    cache_key = f"{symbol}-{from_date}-{to_date}"
    now = time.time()

    # Cache hit for news?
    if cache_key in news_cache:
        ts, data = news_cache[cache_key]
        if now - ts < CACHE_TTL_NEWS:
            return jsonify(data)
    
    try:
        check_rate_limit()
        
        # company-news endpoint doesn't require symbol= in query params, it's part of the path
        # but the Finnhub Python client might abstract that. For direct API call, it's simpler
        # Finnhub API docs show it as /news?symbol=...
        url = f"https://finnhub.io/api/v1/company-news?symbol={symbol}&from={from_date}&to={to_date}&token={FINNHUB_API_KEY}"
        resp = requests.get(url)
        resp.raise_for_status()

        response_text = resp.text
        # print(f"Finnhub Company News raw response for {symbol}: {response_text[:500]}...")

        data = resp.json()
        news_cache[cache_key] = (now, data) # Cache the new news
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

@app.route("/api/chat", methods=["POST"])
def chat_with_gpt():
    try:
        data = request.get_json()
        user_message = data.get("message")
        conversation_history = data.get("history", [])

        if not user_message:
            return jsonify({"error": "Message is required."}), 400

        # Prepare the conversation payload for OpenRouter
        messages_payload = [
            {"role": "system", "content": DEEPDIVE_SYSTEM_PROMPT.strip()},
            *conversation_history,
            {"role": "user", "content": user_message.strip()}
        ]

        openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "deepseek/deepseek-chat-v3-0324",
            "messages": messages_payload,
            "temperature": 0.7,
            # "stream": True # Add this if you want to implement streaming, but it requires frontend changes too
        }

        print(f"Sending to OpenRouter with model deepseek/deepseek-chat-v3-0324: {messages_payload}")

        # --- NEW: Use requests directly ---
        openrouter_resp = requests.post(openrouter_url, headers=headers, json=payload)
        openrouter_resp.raise_for_status() # Raises HTTPError for bad responses (4xx or 5xx)

        gpt_data = openrouter_resp.json()
        gpt_response = gpt_data["choices"][0]["message"]["content"]
        
        # --- NEW: Extract Rate Limit Headers from direct requests response ---
        rate_limit_limit_tokens = openrouter_resp.headers.get("X-Ratelimit-Limit")
        rate_limit_remaining_tokens = openrouter_resp.headers.get("X-Ratelimit-Remaining")
        rate_limit_reset_tokens = openrouter_resp.headers.get("X-Ratelimit-Reset")

        print(f"Received from OpenRouter: {gpt_response}")
        print(f"OpenRouter Rate Limit: {rate_limit_remaining_tokens}/{rate_limit_limit_tokens} tokens, resets in {rate_limit_reset_tokens}s")
        # --- END NEW ---

        return jsonify({
            "response": gpt_response,
            "rateLimits": {
                "limitTokens": rate_limit_limit_tokens,
                "remainingTokens": rate_limit_remaining_tokens,
                "resetTokens": rate_limit_reset_tokens
            }
        })

    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error from OpenRouter: {e.response.status_code} - {e.response.text}")
        return jsonify({"error": f"OpenRouter API Error: {e.response.status_code} - {e.response.text}"}), e.response.status_code
    except requests.exceptions.RequestException as e:
        print(f"Request Exception to OpenRouter: {e}")
        return jsonify({"error": f"Failed to connect to OpenRouter API: {e}"}), 500
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error from OpenRouter: {e}. Raw response: '{openrouter_resp.text}'")
        return jsonify({"error": f"Failed to parse OpenRouter response as JSON. Error: {e}"}), 500
    except Exception as e:
        print(f"An unexpected error occurred in chat_with_gpt: {e}")
        return jsonify({"error": f"An unexpected server error occurred: {e}"}), 500

if __name__ == "__main__":
    if not OPENROUTER_API_KEY:
        print("WARNING: OPENROUTER_API_KEY is not set. AI chat features may fail.")
    if not FINNHUB_API_KEY:
        print("WARNING: FINNHUB_API_KEY is not set. Stock data features may not work.")
    app.run(debug=True, port=5000)