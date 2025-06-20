# services/finnhub_service.py
import requests
from datetime import datetime, timedelta
from config import Config
from utils.cache import (
    check_rate_limit, global_request_timestamps,
    get_cached_data, set_cached_data # Use the new cache functions
)

def get_stock_quote(symbol):
    """Fetches real-time quote for a stock symbol from Finnhub."""
    cached_data = get_cached_data(f"quote:{symbol}") # Pass only key
    if cached_data:
        return cached_data

    check_rate_limit(global_request_timestamps, Config.GLOBAL_RATE_LIMIT)
    
    url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={Config.FINNHUB_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    set_cached_data(f"quote:{symbol}", data, Config.CACHE_TTL_QUOTE) # Pass key, data, ttl
    return data

def get_market_holidays_data(exchange="US"):
    """
    Fetches market holidays for a given exchange from Finnhub.
    Filters holidays to include only today's and upcoming ones within the next month.
    """
    cache_key = f"market_holidays:{exchange}"
    cached_data = get_cached_data(cache_key) # Pass only key
    if cached_data:
        return cached_data

    check_rate_limit(global_request_timestamps, Config.GLOBAL_RATE_LIMIT)

    url = f"https://finnhub.io/api/v1/stock/market-holiday?exchange={exchange}&token={Config.FINNHUB_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    raw_data = resp.json()

    holidays_list = raw_data.get('data', [])
    if not isinstance(holidays_list, list):
        raise ValueError("Finnhub Market Holiday 'data' key returned unexpected non-list type.")

    today_date = datetime.now().date()
    one_month_from_now = today_date + timedelta(days=30)
    
    upcoming_holidays = []
    for holiday in holidays_list:
        if not isinstance(holiday, dict):
            print(f"Warning: Skipping malformed holiday entry: {holiday}")
            continue

        holiday_date_str = holiday.get('atDate')
        if holiday_date_str:
            try:
                holiday_date = datetime.strptime(holiday_date_str, '%Y-%m-%d').date()
                if holiday_date >= today_date and holiday_date <= one_month_from_now:
                    upcoming_holidays.append(holiday)
            except ValueError:
                print(f"Warning: Could not parse holiday date: {holiday_date_str} for holiday {holiday.get('eventName', 'N/A')}")
    
    upcoming_holidays.sort(key=lambda x: datetime.strptime(x['atDate'], '%Y-%m-%d').date())
    
    set_cached_data(cache_key, upcoming_holidays, Config.MARKET_HOLIDAY_CACHE_TTL) # Pass key, data, ttl
    return upcoming_holidays

def get_company_news_data(symbol, from_date=None, to_date=None):
    """Fetches company-specific news from Finnhub."""
    today = datetime.now().strftime('%Y-%m-%d')
    thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    from_date = from_date or thirty_days_ago
    to_date = to_date or today

    cache_key = f"company_news:{symbol}-{from_date}-{to_date}" # More specific key
    cached_data = get_cached_data(cache_key) # Pass only key
    if cached_data:
        return cached_data

    check_rate_limit(global_request_timestamps, Config.GLOBAL_RATE_LIMIT)

    url = f"https://finnhub.io/api/v1/company-news?symbol={symbol}&from={from_date}&to={to_date}&token={Config.FINNHUB_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    set_cached_data(cache_key, data, Config.CACHE_TTL_COMPANY_NEWS) # Pass key, data, ttl
    return data

def get_general_news_data(category="general"):
    """Fetches general market news by category from Finnhub."""
    cache_key = f"general_news:{category}"
    cached_data = get_cached_data(cache_key) # Pass only key
    if cached_data:
        return cached_data

    check_rate_limit(global_request_timestamps, Config.GLOBAL_RATE_LIMIT)

    url = f"https://finnhub.io/api/v1/news?category={category}&token={Config.FINNHUB_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    set_cached_data(cache_key, data, Config.CACHE_TTL_GENERAL_NEWS) # Pass key, data, ttl
    return data

def get_company_profile_data(symbol):
    """Fetches company profile data from Finnhub."""
    cache_key = f"company_profile:{symbol}"
    cached_data = get_cached_data(cache_key) # Pass only key
    if cached_data:
        return cached_data

    check_rate_limit(global_request_timestamps, Config.GLOBAL_RATE_LIMIT)

    url = f"https://finnhub.io/api/v1/stock/profile2?symbol={symbol}&token={Config.FINNHUB_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    set_cached_data(cache_key, data, Config.CACHE_TTL_COMPANY_PROFILE) # Pass key, data, ttl
    return data

def get_stock_metrics_data(symbol):
    """Fetches fundamental stock metrics from Finnhub."""
    # This endpoint can be cached if it's hit frequently and data doesn't change often.
    # For now, keeping it as a direct call as its TTL might be different/longer or less critical.
    # If caching is desired, add it here similar to other Finnhub functions.
    cache_key = f"stock_metrics:{symbol}"
    cached_data = get_cached_data(cache_key)
    if cached_data:
        return cached_data

    check_rate_limit(global_request_timestamps, Config.GLOBAL_RATE_LIMIT)

    url = f"https://finnhub.io/api/v1/stock/metric?symbol={symbol}&metric=all&token={Config.FINNHUB_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    set_cached_data(cache_key, data, Config.CACHE_TTL_BASIC_FINANCIALS) # Reusing this TTL for now
    return data
