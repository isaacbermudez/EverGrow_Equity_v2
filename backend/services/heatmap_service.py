# services/heatmap_service.py
import pandas as pd
import plotly.express as px
import requests
import os
import io
import base64
import json # Import json module for more explicit serialization/deserialization

from config import Config
from utils.cache import get_cached_data, set_cached_data

# It's crucial to have kaleido and plotly installed correctly for image generation
# pip install plotly==5.18.0 kaleido==0.2.1 pandas requests

def _get_spy_heatmap_data(date: str = "one_day") -> pd.DataFrame:
    """
    Fetches the S&P 500 heatmap data from Unusual Whales API.
    This is an internal helper function, the public one will handle caching.
    """
    url = f"https://phx.unusualwhales.com/api/etf/SPY/heatmap?date_range={date}"
    headers = {
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Safari/537.36"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)
        data = response.json()

        if "data" not in data or not data["data"]:
            # Returning an empty DataFrame here to indicate no data, which calling functions can handle
            return pd.DataFrame()

        df = pd.DataFrame(data["data"])

        # Convert relevant columns to numeric types
        # Use errors='coerce' to turn unparseable values into NaN
        df["call_premium"] = pd.to_numeric(df["call_premium"], errors='coerce')
        df["close"] = pd.to_numeric(df["close"], errors='coerce')
        df["high"] = pd.to_numeric(df["high"], errors='coerce')
        df["low"] = pd.to_numeric(df["low"], errors='coerce')
        df["marketcap"] = pd.to_numeric(df["marketcap"], errors='coerce')
        df["open"] = pd.to_numeric(df["open"], errors='coerce')
        df["prev_close"] = pd.to_numeric(df["prev_close"], errors='coerce')
        df["put_premium"] = pd.to_numeric(df["put_premium"], errors='coerce')

        # Drop rows where critical numeric conversions failed
        df.dropna(subset=["close", "prev_close", "marketcap"], inplace=True)

        # Add change column, ensure prev_close is not zero to avoid division by zero
        # Add a small epsilon to prev_close to prevent division by zero for values that are very close to zero
        epsilon = 1e-9
        df["percentage_change"] = (df["close"] - df["prev_close"]) / (df["prev_close"].replace(0, pd.NA) + epsilon) * 100
        df.dropna(subset=["percentage_change"], inplace=True) # Drop NaNs resulting from division by zero or coerce errors

        # Drop rows where the marketcap == 0 (after conversion and NaN handling)
        df = df[df["marketcap"] > 0]

        return df

    except requests.exceptions.RequestException as e:
        print(f"Error fetching SPY heatmap data: {e}")
        raise RuntimeError(f"Failed to fetch SPY heatmap data from API: {e}")
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Error parsing or processing SPY heatmap data: {e}")
        raise ValueError(f"Invalid data received from SPY heatmap API: {e}")
    except Exception as e:
        print(f"An unexpected error occurred in _get_spy_heatmap_data: {e}")
        raise RuntimeError(f"An unexpected error occurred during data fetching: {e}")


def get_spy_heatmap_cached(date: str = "one_day") -> pd.DataFrame:
    """
    Fetches the S&P 500 heatmap data, utilizing cache.
    The DataFrame is serialized to JSON string for caching.
    """
    cache_key = f"spy_heatmap_{date}"
    cached_json_str = get_cached_data(cache_key) # This will return a JSON string or None

    if cached_json_str is not None:
        print(f"Serving SPY heatmap data for '{date}' from cache.")
        try:
            # Use pd.read_json to reconstruct DataFrame from the JSON string
            # io.StringIO is used to treat the string as a file-like object
            return pd.read_json(io.StringIO(cached_json_str))
        except ValueError as e:
            print(f"Error reading cached DataFrame JSON: {e}. Refetching data.")
            # Invalidate cache if corrupted
            set_cached_data(cache_key, None, 0) # Set TTL to 0 to effectively delete
            pass # Fall through to re-fetch

    print(f"Fetching SPY heatmap data for '{date}' from API (not in cache).")
    df = _get_spy_heatmap_data(date)
    
    if not df.empty:
        # Cache the DataFrame as a JSON string using 'orient='split'' for better integrity
        # 'split' format includes index, columns, and data, making reconstruction reliable
        df_json_str = df.to_json(orient='split')
        set_cached_data(cache_key, df_json_str, Config.CACHE_TTL_SPY_HEATMAP)
    
    return df

def create_treemap_image_base64(df: pd.DataFrame) -> str:
    """
    Creates a treemap of the S&P 500 heatmap data and returns it as a base64 encoded PNG string.
    """
    if df.empty:
        print("DataFrame is empty, cannot create treemap.")
        return ""

    # Custom color scale
    color_scale = [
        (0, "#ff2c1c"),  # Bright red at -5%
        (0.5, "#484454"),  # Grey around 0%
        (1, "#30dc5c"),  # Bright green at 5%
    ]

    fig = px.treemap(
        df,
        path=[px.Constant("Sectors"), "sector", "industry", "ticker"],
        values="marketcap",
        color="percentage_change",
        hover_data=["percentage_change", "ticker", "marketcap", "sector", "industry"],
        color_continuous_scale=color_scale,
        range_color=(-5, 5), # Ensure symmetrical range for color, centered at 0
        color_continuous_midpoint=0,
        title="S&P 500 Heatmap"
    )

    fig.update_layout(
        margin=dict(t=50, l=10, r=10, b=10),
        font_size=18,
        coloraxis_colorbar=None, # Hide the color bar if not explicitly needed
        paper_bgcolor="rgba(0,0,0,0)", # Transparent background
        plot_bgcolor="rgba(0,0,0,0)", # Transparent background
    )

    # Adjust text template to show ticker and percentage change
    fig.data[0].texttemplate = "%{customdata[1]}<br>%{customdata[0]:.2f}%"

    fig.update_traces(
        textposition="middle center",
        marker=dict(line=dict(color="black", width=1)),
    )

    fig.update(layout_coloraxis_showscale=False) # Ensure color scale is not shown

    try:
        # Convert to PNG bytes using kaleido
        img_bytes = fig.to_image(format="png", width=1920, height=1080, scale=1)

        # Encode to base64
        base64_img = base64.b64encode(img_bytes).decode('utf-8')
        return base64_img
    except Exception as e:
        print(f"Error generating treemap image: {e}")
        # This error might occur if kaleido is not properly installed or if there's an issue with image generation
        print("Please ensure 'kaleido' is installed: pip install kaleido")
        return ""

# Optional: Function to save image to file (for local testing/debugging)
def save_treemap_to_file(df: pd.DataFrame, file_path: str = "img/spy_heatmap.png") -> None:
    """
    Creates a treemap and saves it to a specified file path.
    """
    output_dir = os.path.dirname(file_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    if df.empty:
        print(f"DataFrame is empty, cannot save treemap to {file_path}.")
        return

    fig = px.treemap(
        df,
        path=[px.Constant("Sectors"), "sector", "industry", "ticker"],
        values="marketcap",
        color="percentage_change",
        hover_data=["percentage_change", "ticker", "marketcap", "sector", "industry"],
        color_continuous_scale=[(0, "#ff2c1c"), (0.5, "#484454"), (1, "#30dc5c")],
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

    try:
        fig.write_image(file=file_path, format="png", width=1920, height=1080, scale=1)
        print(f"Heatmap saved to {file_path}")
    except Exception as e:
        print(f"Error saving treemap to file {file_path}: {e}")
        print("Please ensure 'kaleido' is installed: pip install kaleido")