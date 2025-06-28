# utils/cache.py
import time
import redis
import json
import pandas as pd # Import pandas to handle DataFrame serialization/deserialization
import io # Needed for pd.read_json from a string
from datetime import datetime, timedelta
from config import Config

# Initialize Redis connection pool (best practice for Flask/Gunicorn)
# Use decode_responses=True to get strings instead of bytes
try:
    redis_client = redis.StrictRedis(
        host=Config.REDIS_HOST,
        port=Config.REDIS_PORT,
        db=Config.REDIS_DB,
        password=Config.REDIS_PASSWORD,
        decode_responses=True # Decodes responses from bytes to strings
    )
    # Ping to check connection immediately
    redis_client.ping()
    print("Successfully connected to Redis!")
except redis.exceptions.ConnectionError as e:
    print(f"ERROR: Could not connect to Redis at {Config.REDIS_HOST}:{Config.REDIS_PORT}. Caching will be disabled. Error: {e}")
    redis_client = None # Set to None if connection fails to disable caching

# Rate limiting timestamps (still in-memory for simplicity for now, can be moved to Redis if global rate limiting across servers is needed)
global_request_timestamps = []
alpha_vantage_timestamps = []
fred_timestamps = [] # New: dedicated list for FRED API timestamps

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

def get_cached_data(key):
    """
    Retrieves data from Redis cache if fresh, otherwise returns None.
    Handles deserialization for DataFrames and other JSON data.
    """
    if redis_client is None:
        return None # Caching disabled if Redis connection failed

    try:
        cached_value = redis_client.get(key)
        if cached_value:
            # We need to determine if it's a DataFrame or just a regular JSON object.
            # A common pattern for DataFrames is to store them with a specific "type" indicator
            # or rely on a consistent serialization format.
            # For simplicity, let's assume if it's a DataFrame, it was stored using to_json(orient='split').
            # If not, it's a regular JSON object.

            # Attempt to load as a general JSON first
            try:
                # Try loading as a standard JSON string
                deserialized_data = json.loads(cached_value)

                # Check if it looks like a DataFrame serialized with orient='split'
                # This is a heuristic: it checks for 'columns' and 'data' keys
                if isinstance(deserialized_data, dict) and "columns" in deserialized_data and "data" in deserialized_data:
                    # It's likely a DataFrame, so convert it
                    # pd.read_json can read from a string directly
                    return pd.read_json(io.StringIO(cached_value), orient='split')
                else:
                    # It's a regular JSON object (dict, list, string, etc.)
                    return deserialized_data
            except json.JSONDecodeError:
                # If it's not valid JSON, it might be a raw string
                print(f"DEBUG: Cached value for key '{key}' is not valid JSON. Returning as raw string.")
                return cached_value # Return as raw string if not JSON

    except Exception as e:
        print(f"Error retrieving from Redis cache for key '{key}': {e}")
    return None

def set_cached_data(key, data, ttl_seconds):
    """
    Stores data in Redis cache with a specified TTL.
    Handles serialization for DataFrames and other JSON data.
    """
    if redis_client is None:
        return # Caching disabled if Redis connection failed

    try:
        if isinstance(data, pd.DataFrame):
            # Serialize DataFrame to JSON string using pandas' method
            json_data = data.to_json(orient='split') # 'split' format is good for preserving index and column names
        else:
            # For other data types, use standard json.dumps
            json_data = json.dumps(data)

        redis_client.setex(key, ttl_seconds, json_data)
    except Exception as e:
        print(f"Error setting to Redis cache for key '{key}': {e}")