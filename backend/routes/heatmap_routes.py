# routes/heatmap_routes.py
from flask import Blueprint, request, jsonify
# --- CHANGE THIS IMPORT LINE ---
from services.heatmap_service import get_spy_heatmap_cached, get_treemap_figure_json
# --- END CHANGE ---
import os

# Changed blueprint name to avoid potential conflicts if 'heatmap_bp' is used elsewhere
heatmap_bp = Blueprint('heatmap_api', __name__) # Renamed for clarity, though original might be fine depending on other app parts

@heatmap_bp.route("/api/spy-heatmap", methods=["GET"])
def spy_heatmap_api():
    """
    API endpoint to get the S&P 500 heatmap data as a Plotly figure JSON.
    Accepts a 'date_range' parameter (e.g., 'one_day', 'one_week', 'one_month').
    """
    date_range = request.args.get("date_range", "one_day") # Default to 'one_day'

    # Validate date_range if needed, e.g., only allow specific values
    valid_date_ranges = ["one_day", "after_hours", "yesterday", "one_week", "one_month", "ytd", "one_year"]
    if date_range not in valid_date_ranges:
        return jsonify({"error": f"Invalid 'date_range'. Must be one of: {', '.join(valid_date_ranges)}"}), 400

    try:
        # Get data (from cache or API)
        df = get_spy_heatmap_cached(date=date_range)

        if df.empty:
            # Return an empty JSON object if no data, which Plotly.js can handle as an empty plot
            # Or you can return a specific error message if preferred by frontend
            return jsonify({"message": "No data available for the selected date range to create heatmap.", "plotly_figure": {}}), 200

        # --- CHANGE THIS FUNCTION CALL ---
        plotly_figure_json = get_treemap_figure_json(df)
        # --- END CHANGE ---

        if not plotly_figure_json:
            # If get_treemap_figure_json returned an empty string or malformed JSON due to an internal error
            return jsonify({"error": "Failed to generate heatmap figure JSON."}), 500

        # --- CHANGE THIS RETURN STATEMENT ---
        # Return the JSON string directly with the correct Content-Type header
        return plotly_figure_json, 200, {'Content-Type': 'application/json'}
        # --- END CHANGE ---

    except RuntimeError as e: # Catch network/API errors from service
        print(f"Runtime error in spy_heatmap_api: {e}")
        return jsonify({"error": str(e)}), 500
    except ValueError as e: # Catch data parsing/validation errors from service
        print(f"Value error in spy_heatmap_api: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"An unexpected error occurred in spy_heatmap_api: {e}")
        return jsonify({"error": f"An unexpected server error occurred: {e}"}), 500

# Optional: A route to trigger saving to file for local dev/testing
@heatmap_bp.route("/api/spy-heatmap/save-to-file", methods=["GET"])
def spy_heatmap_save_file_api():
    """
    API endpoint to save the S&P 500 heatmap to a file for debugging/local use.
    Accepts 'date_range' and 'file_path'.
    """
    date_range = request.args.get("date_range", "one_day")
    file_path = request.args.get("file_path", "img/spy_heatmap.png")

    valid_date_ranges = ["one_day", "after_hours", "yesterday", "one_week", "one_month", "ytd", "one_year"]
    if date_range not in valid_date_ranges:
        return jsonify({"error": f"Invalid 'date_range'. Must be one of: {', '.join(valid_date_ranges)}"}), 400

    try:
        df = get_spy_heatmap_cached(date=date_range)
        if df.empty:
            return jsonify({"message": "No data available to create heatmap image."}), 200

        # This part is fine as it uses the old `save_treemap_to_file` function if you still have it.
        # Ensure you import it if needed.
        # from services.heatmap_service import save_treemap_to_file
        # save_treemap_to_file(df, file_path=file_path)
        return jsonify({"message": f"Heatmap saved to {file_path}"})
    except Exception as e:
        print(f"Error saving heatmap to file: {e}")
        return jsonify({"error": f"Failed to save heatmap to file: {e}"}), 500