# utils/cache.py
#This file will hold your in-memory caching logic and rate-limiting timestamp lists.
import time
import redis
import json # To serialize/deserialize complex data to/from JSON for Redis
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
    TTL is handled by Redis's EX/PX commands when setting data.
    """
    if redis_client is None:
        return None # Caching disabled if Redis connection failed

    try:
        cached_value = redis_client.get(key)
        if cached_value:
            return json.loads(cached_value) # Deserialize JSON string
    except Exception as e:
        print(f"Error retrieving from Redis cache for key '{key}': {e}")
    return None

def set_cached_data(key, data, ttl_seconds):
    """
    Stores data in Redis cache with a specified TTL.
    """
    if redis_client is None:
        return # Caching disabled if Redis connection failed

    try:
        # Serialize data to JSON string before storing in Redis
        json_data = json.dumps(data)
        redis_client.setex(key, ttl_seconds, json_data)
    except Exception as e:
        print(f"Error setting to Redis cache for key '{key}': {e}")

