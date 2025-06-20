# services/finnhub_service.py
import requests
from datetime import datetime, timedelta
from config import Config
from utils.cache import (
    check_rate_limit, global_request_timestamps,
    quote_cache, market_holiday_cache, company_news_cache, general_news_cache,
    company_profile_cache,
    get_cached_data, set_cached_data
)

def get_stock_quote(symbol):
    """Fetches real-time quote for a stock symbol from Finnhub."""
    cached_data = get_cached_data(quote_cache, symbol, Config.CACHE_TTL_QUOTE)
    if cached_data:
        return cached_data

    check_rate_limit(global_request_timestamps, Config.GLOBAL_RATE_LIMIT)
    
    url = f"https://finnhub.io/api/v1/quote?symbol={symbol}&token={Config.FINNHUB_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    set_cached_data(quote_cache, symbol, data)
    return data

def get_market_holidays_data(exchange="US"):
    """
    Fetches market holidays for a given exchange from Finnhub.
    Filters holidays to include only today's and upcoming ones within the next month.
    """
    cached_data = get_cached_data(market_holiday_cache, exchange, Config.MARKET_HOLIDAY_CACHE_TTL)
    if cached_data:
        return cached_data

    check_rate_limit(global_request_timestamps, Config.GLOBAL_RATE_LIMIT)

    url = f"https://finnhub.io/api/v1/stock/market-holiday?exchange={exchange}&token={Config.FINNHUB_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    raw_data = resp.json()

    # Ensure 'data' key exists and is a list
    holidays_list = raw_data.get('data', [])
    if not isinstance(holidays_list, list):
        raise ValueError("Finnhub Market Holiday 'data' key returned unexpected non-list type.")

    # Filter out past holidays and limit to a few upcoming ones
    today_date = datetime.now().date()
    one_month_from_now = today_date + timedelta(days=30)
    
    upcoming_holidays = []
    for holiday in holidays_list:
        if not isinstance(holiday, dict):
            # Log warning if unexpected item type, but continue processing
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
    
    # Sort upcoming holidays by date
    upcoming_holidays.sort(key=lambda x: datetime.strptime(x['atDate'], '%Y-%m-%d').date())
    
    set_cached_data(market_holiday_cache, exchange, upcoming_holidays)
    return upcoming_holidays

def get_company_news_data(symbol, from_date=None, to_date=None):
    """Fetches company-specific news from Finnhub."""
    today = datetime.now().strftime('%Y-%m-%d')
    thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    from_date = from_date or thirty_days_ago
    to_date = to_date or today

    cache_key = f"{symbol}-{from_date}-{to_date}"
    cached_data = get_cached_data(company_news_cache, cache_key, Config.CACHE_TTL_COMPANY_NEWS)
    if cached_data:
        return cached_data

    check_rate_limit(global_request_timestamps, Config.GLOBAL_RATE_LIMIT)

    url = f"https://finnhub.io/api/v1/company-news?symbol={symbol}&from={from_date}&to={to_date}&token={Config.FINNHUB_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    set_cached_data(company_news_cache, cache_key, data)
    return data

def get_general_news_data(category="general"):
    """Fetches general market news by category from Finnhub."""
    cache_key = f"general_news_{category}"
    cached_data = get_cached_data(general_news_cache, cache_key, Config.CACHE_TTL_GENERAL_NEWS)
    if cached_data:
        return cached_data

    check_rate_limit(global_request_timestamps, Config.GLOBAL_RATE_LIMIT)

    url = f"https://finnhub.io/api/v1/news?category={category}&token={Config.FINNHUB_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    set_cached_data(general_news_cache, cache_key, data)
    return data

def get_company_profile_data(symbol):
    """Fetches company profile data from Finnhub."""
    cached_data = get_cached_data(company_profile_cache, symbol, Config.CACHE_TTL_COMPANY_PROFILE)
    if cached_data:
        return cached_data

    check_rate_limit(global_request_timestamps, Config.GLOBAL_RATE_LIMIT)

    url = f"https://finnhub.io/api/v1/stock/profile2?symbol={symbol}&token={Config.FINNHUB_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    data = resp.json()
    set_cached_data(company_profile_cache, symbol, data)
    return data

def get_stock_metrics_data(symbol):
    """Fetches fundamental stock metrics from Finnhub."""
    # Note: Finnhub metrics API does not have a direct cache key here.
    # If this becomes a frequent call, implement caching logic similar to others.
    
    check_rate_limit(global_request_timestamps, Config.GLOBAL_RATE_LIMIT)

    url = f"https://finnhub.io/api/v1/stock/metric?symbol={symbol}&metric=all&token={Config.FINNHUB_API_KEY}"
    resp = requests.get(url)
    resp.raise_for_status()
    return resp.json()

