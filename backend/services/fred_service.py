# services/fred_service.py
import os
from fredapi import Fred
import pandas as pd
from dotenv import load_dotenv
from utils.cache import get_cached_data, set_cached_data, check_rate_limit, fred_timestamps
from config import Config
import numpy as np # Import numpy to handle NaN values

# Load environment variables from .env file (if not already loaded by app.py)
load_dotenv()

# Initialize Fred API client globally to avoid re-initialization per request
fred_api_key = os.getenv('FRED_API_KEY')
if not fred_api_key or fred_api_key == "YOUR_FRED_API_KEY_HERE":
    print("Warning: FRED_API_KEY is not set or is a placeholder. FRED service may not function.")
    # You might want to raise an error or handle this more robustly in a production app
    fred_client = None
else:
    fred_client = Fred(api_key=fred_api_key)

def get_fred_series_data(series_ids: list):
    """
    Fetches data for a list of FRED series IDs.
    Applies rate limiting and caching.

    Args:
        series_ids (list): A list of FRED series IDs (e.g., ['SP500', 'NASDAQ100']).

    Returns:
        dict: A dictionary where keys are series IDs and values are dictionaries
              containing 'data' (latest 5 observations) and 'full_data' (all observations).
              Returns an empty dict if no data is found or an error occurs.
    """
    if fred_client is None:
        raise RuntimeError("FRED API client not initialized. Check FRED_API_KEY configuration.")

    check_rate_limit(fred_timestamps, Config.FRED_RATE_LIMIT)

    results = {}
    for series_id in series_ids:
        cache_key = f"fred_series_{series_id}"
        cached_data = get_cached_data(cache_key)

        if cached_data:
            results[series_id] = cached_data
            continue

        try:
            print(f"Fetching live data for FRED series: {series_id}")
            # get_series returns a pandas Series.
            series_data = fred_client.get_series(series_id)

            if series_data is not None and not series_data.empty:
                # Explicitly convert np.nan to None during dictionary creation
                # This ensures proper JSON serialization of missing values as 'null'
                latest_observations = {
                    str(k): (v if not pd.isna(v) else None)
                    for k, v in series_data.tail(5).items()
                }
                full_observations = {
                    str(k): (v if not pd.isna(v) else None)
                    for k, v in series_data.items()
                }

                data_to_cache = {
                    "latest_observations": latest_observations,
                    "full_data": full_observations
                }
                set_cached_data(cache_key, data_to_cache, Config.CACHE_TTL_FRED)
                results[series_id] = data_to_cache
            else:
                print(f"No data found for FRED series ID: {series_id}")
                results[series_id] = {"latest_observations": {}, "full_data": {}}

        except Exception as e:
            print(f"Error fetching data for FRED series ID {series_id}: {e}")
            results[series_id] = {"error": str(e)}

    return results

