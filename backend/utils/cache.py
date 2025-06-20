# utils/cache.py
#This file will hold your in-memory caching logic and rate-limiting timestamp lists.
import time
from datetime import datetime, timedelta

# In-memory caches (these will eventually be replaced by Redis for production)
quote_cache = {}
market_holiday_cache = {}
company_news_cache = {} # Renamed from 'news_cache' for clarity
general_news_cache = {}
company_profile_cache = {}
basic_financials_cache = {}
chat_cache = {} # For AI chat history or responses

# Rate limiting timestamps
global_request_timestamps = []
alpha_vantage_timestamps = []

def check_rate_limit(timestamps_list, limit_per_minute):
    """
    Checks and enforces a rate limit for API calls.
    Raises RuntimeError if the limit is exceeded.
    """
    now = time.time()
    # Filter out old timestamps (older than 1 minute)
    timestamps_list[:] = [t for t in timestamps_list if now - t < 60]

    if len(timestamps_list) >= limit_per_minute:
        raise RuntimeError(f"Rate limit exceeded ({limit_per_minute} calls per minute). Please wait a moment and try again.")
    timestamps_list.append(now)

def get_cached_data(cache_dict, key, ttl_seconds):
    """
    Retrieves data from cache if fresh, otherwise returns None.
    """
    now = time.time()
    if key in cache_dict:
        timestamp, data = cache_dict[key]
        if now - timestamp < ttl_seconds:
            return data
    return None

def set_cached_data(cache_dict, key, data):
    """
    Stores data in cache with current timestamp.
    """
    cache_dict[key] = (time.time(), data)

