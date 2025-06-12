
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv
import time

load_dotenv()
app = Flask(__name__)
CORS(app)

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
BASE_URL = "https://finnhub.io/api/v1"

def fetch_stock_data(symbol):
    quote_url = f"{BASE_URL}/quote?symbol={symbol}&token={FINNHUB_API_KEY}"
    profile_url = f"{BASE_URL}/stock/profile2?symbol={symbol}&token={FINNHUB_API_KEY}"

    try:
        quote_response = requests.get(quote_url)
        profile_response = requests.get(profile_url)

        quote_data = quote_response.json()
        profile_data = profile_response.json()

        if 'c' not in quote_data or quote_data['c'] is None:
            raise ValueError("Missing 'current price' in response.")

        return {
            "symbol": symbol,
            "price": quote_data.get("c"),
            "open": quote_data.get("o"),
            "high": quote_data.get("h"),
            "low": quote_data.get("l"),
            "previous_close": quote_data.get("pc"),
            "name": profile_data.get("name"),
            "market_cap": profile_data.get("marketCapitalization"),
            "exchange": profile_data.get("exchange"),
            "currency": profile_data.get("currency")
        }

    except Exception as e:
        return {"symbol": symbol, "error": str(e)}

@app.route('/api/analyze-portfolio', methods=['POST'])
def analyze_portfolio():
    print("\n--- Backend Request Received (Batch) ---")
    portfolio_data = request.json.get('portfolio', [])
    if not isinstance(portfolio_data, list) or not portfolio_data:
        return jsonify({'error': 'Invalid or empty portfolio data'}), 400

    symbols = list({item['symbol'] for item in portfolio_data if 'symbol' in item})
    print(f"Processing {len(symbols)} symbols...")

    results = {}
    for symbol in symbols:
        print(f"Fetching data for {symbol}")
        results[symbol] = fetch_stock_data(symbol)
        time.sleep(1)  # Respect Finnhub free tier limit

    return jsonify(results), 200

if __name__ == '__main__':
    app.run(debug=True)
