# services/alpha_vantage_service.py
import requests
import json
from config import Config
from utils.cache import (
    check_rate_limit, alpha_vantage_timestamps,
    get_cached_data, set_cached_data # Use the new cache functions
)

def get_alpha_vantage_financial_data(symbol, function_type):
    """
    Fetches financial data (overview, income statement, balance sheet, cash flow)
    for a given symbol from Alpha Vantage.
    """
    if not Config.ALPHA_VANTAGE_API_KEY or Config.ALPHA_VANTAGE_API_KEY == "YOUR_ALPHA_VANTAGE_API_KEY":
        return {"error": "ALPHA_VANTAGE_API_KEY is not set correctly in your environment variables."}

    cache_key = f"alpha_vantage:{symbol}:{function_type}" # Specific key for Alpha Vantage data
    cached_data = get_cached_data(cache_key) # Pass only key
    if cached_data:
        return cached_data

    check_rate_limit(alpha_vantage_timestamps, Config.ALPHA_VANTAGE_RATE_LIMIT)

    url = f"https://www.alphavantage.co/query?function={function_type}&symbol={symbol}&apikey={Config.ALPHA_VANTAGE_API_KEY}"
    response_text = ""
    try:
        resp = requests.get(url)
        resp.raise_for_status()
        response_text = resp.text

        data = resp.json()

        if "Information" in data and "rate limit" in data["Information"].lower():
            raise RuntimeError(f"Alpha Vantage Rate Limit Exceeded: {data['Information']}")
        if "Error Message" in data:
            raise ValueError(f"Alpha Vantage API Error for {function_type} - {symbol}: {data['Error Message']}")
        if not data or not any(key in data for key in ["annualReports", "quarterlyReports", "Symbol", "AssetType"]):
            raise ValueError(f"No {function_type.replace('_', ' ').lower()} data found for symbol: {symbol}. Raw response: {response_text}")

        set_cached_data(cache_key, data, Config.CACHE_TTL_ALPHA_VANTAGE_FINANCIALS) # Pass key, data, ttl
        return data
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse Alpha Vantage response for {function_type} as JSON for {symbol}. Error: {e}. Raw: {response_text[:200]}...")
    except requests.exceptions.RequestException as e:
        if hasattr(e, 'response') and e.response is not None:
            raise RuntimeError(f"HTTP error {e.response.status_code} from Alpha Vantage ({function_type}) API: {e.response.text}")
        raise RuntimeError(f"Failed to connect to Alpha Vantage ({function_type}) API for {symbol}: {e}")
    except Exception as e:
        raise RuntimeError(f"An unexpected error occurred in get_alpha_vantage_financial_data for {symbol} ({function_type}): {e}")

