from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, time, os
import json # Import json for specific JSONDecodeError
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "YOUR_API_KEY")
print(f"FINNHUB_API_KEY loaded: {FINNHUB_API_KEY}")

RATE_LIMIT = 60         # max calls / minute
CACHE_TTL_QUOTE = 60    # seconds for stock quotes
CACHE_TTL_NEWS = 300    # seconds (5 minutes for news)
MARKET_STATUS_CACHE_TTL = 300 # seconds (5 minutes for market status)

request_timestamps = []
quote_cache = {}
market_status_cache = {}
news_cache = {} # New cache for news

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


if __name__ == "__main__":
    app.run(debug=True, port=5000)