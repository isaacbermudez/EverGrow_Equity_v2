from flask import Flask, request, jsonify
from flask_cors import CORS
import requests, time, os

app = Flask(__name__)
CORS(app)

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "YOUR_API_KEY")
RATE_LIMIT = 60         # max calls / minute
CACHE_TTL = 60          # seconds

# sliding‐window timestamps for rate limit
request_timestamps = []
# simple in‐memory cache: { symbol: (timestamp, quote_json) }
quote_cache = {}

def get_quote(symbol):
    now = time.time()
    # cache hit?
    if symbol in quote_cache:
        ts, data = quote_cache[symbol]
        if now - ts < CACHE_TTL:
            return data
    # rate‐limit check
    global request_timestamps
    request_timestamps = [t for t in request_timestamps if now - t < 60]
    if len(request_timestamps) >= RATE_LIMIT:
        raise RuntimeError("Rate limit exceeded")
    # fetch from Finnhub¿
    url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={FINNHUB_API_KEY}"
    resp = requests.get(url)
    request_timestamps.append(now)
    resp.raise_for_status()
    data = resp.json()
    quote_cache[symbol] = (now, data)
    return data

@app.route("/api/analyze-portfolio", methods=["POST"])
def analyze_portfolio():
    assets = request.get_json()
    if not isinstance(assets, list):
        return jsonify({"error": "Invalid format. Expecting a list of asset objects."}), 400

    # clean old timestamps
    now = time.time()
    global request_timestamps
    request_timestamps = [t for t in request_timestamps if now - t < 60]

    remaining = RATE_LIMIT - len(request_timestamps)

    results = []
    for item in assets:
        sym = item.get("Symbol") or item.get("symbol")
        ci  = item.get("CI")     or item.get("ci", 0)
        qty = item.get("Holdings") or item.get("holdings", 0)
        # Ensure you are correctly getting 'Sector' and 'Category' from your JSON
        # Your JSON uses uppercase keys, so .get("Sector") and .get("Category") are correct.
        sector = item.get("Sector") or item.get("sector", "N/A") # This correctly gets 'Sector'
        category = item.get("Category") or item.get("category", "N/A") # This correctly gets 'Category'

        if not sym:
            continue

        try:
            q = get_quote(sym)
            current = q.get("c") or 0.0
        except RuntimeError as e:
            return jsonify({"error": str(e), "remaining": remaining}), 429
        except Exception:
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
            "sector": sector,   # Make sure this is included in the response
            "category": category # Make sure this is included in the response
        })

    return jsonify({"results": results, "remaining": remaining})

if __name__ == "__main__":
    app.run(debug=True, port=5000)