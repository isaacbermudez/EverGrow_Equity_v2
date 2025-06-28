# services/heatmap_service.py
import pandas as pd
import plotly.express as px
import requests
import os
import io
import base64
import json
import logging # Import the logging module

from config import Config
from utils.cache import get_cached_data, set_cached_data

# Configure logging
# For a production environment, you might want a more sophisticated logging setup
# For now, this will show INFO level messages and above to the console
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def _get_spy_heatmap_data(date: str = "one_day") -> pd.DataFrame:
    """
    Fetches the S&P 500 heatmap data from Unusual Whales API.
    This is a private helper function, intended to be called by get_spy_heatmap_cached.

    Parameters
    ----------
    date : str, optional
        Options are: one_day, after_hours, yesterday, one_week, one_month, ytd, one_year, by default "one_day"

    Returns
    -------
    pd.DataFrame
        The S&P 500 heatmap data as a DataFrame.
    """
    logger.info(f"Fetching SPY heatmap data for '{date}' from API (not in cache).")
    try:
        # Construct the API URL. Ensure Config.UNUSUALWHALES_API_BASE is correctly set.
        api_url = f"{Config.UNUSUALWHALES_API_BASE}/api/etf/SPY/heatmap?date_range={date}"
        logger.debug(f"Fetching from API: {api_url}") # Changed to debug for less verbose output

        response = requests.get(
            api_url,
            headers={
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36"
            },
            timeout=15 # Added timeout
        )
        response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)
        data = response.json()

        if not data or not data.get("data"):
            logger.warning("API response is empty or missing 'data' key.")
            return pd.DataFrame()

        # Create DataFrame
        df = pd.DataFrame(data["data"])
        logger.debug(f"After initial DataFrame creation (from API response): type={type(df)}, shape={df.shape}")

        # Convert relevant columns to numeric types
        numeric_cols = ["call_premium", "close", "high", "low", "marketcap", "open", "prev_close", "put_premium"]
        for col in numeric_cols:
            if col in df.columns:
                # Coerce errors will turn non-numeric values into NaN
                df[col] = pd.to_numeric(df[col], errors='coerce')
        logger.debug(f"After numeric conversions: type={type(df)}, shape={df.shape}")

        # Drop rows where critical numeric columns are NaN after conversion
        df.dropna(subset=["close", "prev_close", "marketcap"], inplace=True)
        logger.debug(f"After dropping NaNs in critical columns: type={type(df)}, shape={df.shape}")


        # Add change column
        # Ensure prev_close is not zero to avoid division by zero
        df["percentage_change"] = (
            (df["close"] - df["prev_close"]) / df["prev_close"].replace(0, pd.NA) * 100
        )
        logger.debug(f"After calculating percentage_change: type={type(df)}, shape={df.shape}")

        # Drop rows where percentage_change might be NaN after calculation (e.g., if prev_close was 0)
        df.dropna(subset=["percentage_change"], inplace=True)
        logger.debug(f"After dropping NaNs in percentage_change: type={type(df)}, shape={df.shape}")


        # Drop rows where the marketcap == 0 (after conversion to numeric)
        df = df[df["marketcap"] > 0]
        logger.debug(f"After filtering marketcap > 0: type={type(df)}, shape={df.shape}")

        return df

    except requests.exceptions.HTTPError as http_err:
        logger.error(f"HTTP error occurred: {http_err} - Response: {http_err.response.text}")
        raise RuntimeError(f"API HTTP error: {http_err}") from http_err
    except requests.exceptions.ConnectionError as conn_err:
        logger.error(f"Connection error occurred: {conn_err}")
        raise RuntimeError(f"API connection error: {conn_err}") from conn_err
    except requests.exceptions.Timeout as timeout_err:
        logger.error(f"Timeout error occurred: {timeout_err}")
        raise RuntimeError(f"API request timed out: {timeout_err}") from timeout_err
    except requests.exceptions.RequestException as req_err:
        logger.error(f"An unexpected request error occurred: {req_err}")
        raise RuntimeError(f"API request failed: {req_err}") from req_err
    except (KeyError, TypeError, ValueError) as data_err:
        logger.error(f"Error processing API data: {data_err}")
        raise ValueError(f"Error parsing API response data: {data_err}") from data_err
    except Exception as e:
        logger.critical(f"An unexpected error occurred in _get_spy_heatmap_data: {e}", exc_info=True) # exc_info to print traceback
        raise RuntimeError(f"An unexpected error occurred: {e}") from e


def get_spy_heatmap_cached(date: str = "one_day", expire: int = Config.CACHE_TTL_SPY_HEATMAP) -> pd.DataFrame:
    """
    Fetches S&P 500 heatmap data, utilizing Redis cache.

    Parameters
    ----------
    date : str, optional
        Date range for the heatmap, by default "one_day".
    expire : int, optional
        Cache expiration time in seconds, by default Config.CACHE_EXPIRATION.

    Returns
    -------
    pd.DataFrame
        S&P 500 heatmap data.
    """
    cache_key = f"spy_heatmap_{date}"
    df = get_cached_data(cache_key)

    if df is not None:
        logger.info(f"Serving SPY heatmap data for '{date}' from cache.")
        return df
    else:
        df = _get_spy_heatmap_data(date)
        if not df.empty:
            set_cached_data(cache_key, df, expire)
        return df

def get_treemap_figure_json(df: pd.DataFrame) -> str:
    """
    Creates a treemap of the S&P 500 heatmap data and returns it as a Plotly figure JSON string.
    """
    logger.debug(f"Inside get_treemap_figure_json. Input df type: {type(df)}")
    if df.empty:
        logger.warning("DataFrame is empty, cannot create treemap.")
        return "{}" # Return an empty JSON object for an empty DataFrame

    # Explicitly cast types for Plotly
    df['sector'] = df['sector'].astype(str)
    df['industry'] = df['industry'].astype(str)
    df['ticker'] = df['ticker'].astype(str)
    df['marketcap'] = pd.to_numeric(df['marketcap'], errors='coerce').astype(float) # Ensure float after potential NaN
    df['percentage_change'] = pd.to_numeric(df['percentage_change'], errors='coerce').astype(float) # Ensure float after potential NaN

    # Drop any NaNs that might have resulted from coercion here, especially for values
    df.dropna(subset=['marketcap', 'percentage_change'], inplace=True)

    logger.debug(f"Data types before treemap creation: \n{df[['sector', 'industry', 'ticker', 'marketcap', 'percentage_change']].dtypes}")

    # Custom color scale
    color_scale = [
        (0, "#ff2c1c"),  # Bright red at -5%
        (0.5, "#484454"),  # Grey around 0%
        (1, "#30dc5c"),  # Bright green at 5%
    ]

    try:
        fig = px.treemap(
            df,
            path=[px.Constant("Sectors"), "sector", "industry", "ticker"],
            values="marketcap",
            color="percentage_change",
            hover_data=["percentage_change", "ticker", "marketcap", "sector", "industry"],
            color_continuous_scale=color_scale,
            range_color=(-5, 5),
            color_continuous_midpoint=0,
            title="S&P 500 Heatmap"
        )

        fig.update_layout(
            margin=dict(t=50, l=10, r=10, b=10),
            font_size=18,
            coloraxis_colorbar=None,
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
        )

        fig.data[0].texttemplate = "%{customdata[1]}<br>%{customdata[0]:.2f}%"

        fig.update_traces(
            textposition="middle center",
            marker=dict(line=dict(color="black", width=1)),
        )

        fig.update(layout_coloraxis_showscale=False)

        return fig.to_json()

    except Exception as e:
        logger.error(f"Error generating treemap figure JSON: {e}")
        return "{}" # Return empty JSON on error for now

# Optional: Function to save image to file (for local testing/debugging)
# If you want this, you'll need the kaleido library (pip install kaleido)
# def save_treemap_to_file(df: pd.DataFrame, file_path: str = "img/spy_heatmap.png") -> None:
#     # This function needs plotly.io.write_image and kaleido
#     # You had an implementation for this previously, ensure it's correct if you enable it.
#     # Example:
#     # import plotly.io as pio
#     # fig = px.treemap(...) # Recreate the treemap or pass figure
#     # pio.write_image(fig, file_path)
#     logger.debug(f"save_treemap_to_file called but not fully implemented/enabled for this version.")
#     pass