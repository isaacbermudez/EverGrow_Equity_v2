# services/alpha_vantage_service.py
import requests
import json
from config import Config
from utils.cache import (
    check_rate_limit, alpha_vantage_timestamps,
    basic_financials_cache,
    get_cached_data, set_cached_data
)

def get_alpha_vantage_financial_data(symbol, function_type):
    """
    Fetches financial data (overview, income statement, balance sheet, cash flow)
    for a given symbol from Alpha Vantage.
    """
    if not Config.ALPHA_VANTAGE_API_KEY or Config.ALPHA_VANTAGE_API_KEY == "YOUR_ALPHA_VANTAGE_API_KEY":
        return {"error": "ALPHA_VANTAGE_API_KEY is not set correctly in your environment variables."}

    cache_key = f"{symbol}-{function_type}"
    cached_data = get_cached_data(basic_financials_cache, cache_key, Config.CACHE_TTL_ALPHA_VANTAGE_FINANCIALS)
    if cached_data:
        return cached_data

    check_rate_limit(alpha_vantage_timestamps, Config.ALPHA_VANTAGE_RATE_LIMIT)

    url = f"https://www.alphavantage.co/query?function={function_type}&symbol={symbol}&apikey={Config.ALPHA_VANTAGE_API_KEY}"
    response_text = "" # Initialize for error reporting
    try:
        resp = requests.get(url)
        resp.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        response_text = resp.text

        data = resp.json()

        # Alpha Vantage specific error handling
        if "Information" in data and "rate limit" in data["Information"].lower():
            raise RuntimeError(f"Alpha Vantage Rate Limit Exceeded: {data['Information']}")
        if "Error Message" in data:
            raise ValueError(f"Alpha Vantage API Error for {function_type} - {symbol}: {data['Error Message']}")
        if not data or not any(key in data for key in ["annualReports", "quarterlyReports", "Symbol", "AssetType"]):
            # Specific check for missing expected data within a valid response
            raise ValueError(f"No {function_type.replace('_', ' ').lower()} data found for symbol: {symbol}. Raw response: {response_text}")

        set_cached_data(basic_financials_cache, cache_key, data)
        return data
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse Alpha Vantage response for {function_type} as JSON for {symbol}. Error: {e}. Raw: {response_text[:200]}...")
    except requests.exceptions.RequestException as e:
        # Catch network-related errors, e.g., connection refused, timeouts
        if hasattr(e, 'response') and e.response is not None:
            raise RuntimeError(f"HTTP error {e.response.status_code} from Alpha Vantage ({function_type}) API: {e.response.text}")
        raise RuntimeError(f"Failed to connect to Alpha Vantage ({function_type}) API for {symbol}: {e}")
    except Exception as e:
        # General catch-all for any other unexpected errors
        raise RuntimeError(f"An unexpected error occurred in get_alpha_vantage_financial_data for {symbol} ({function_type}): {e}")

