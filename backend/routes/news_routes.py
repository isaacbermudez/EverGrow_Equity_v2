# routes/news_routes.py
from flask import Blueprint, request, jsonify
from services.finnhub_service import get_company_news_data, get_general_news_data, get_market_holidays_data

news_bp = Blueprint('news_bp', __name__)

@news_bp.route("/api/company-news", methods=["GET"])
def company_news_api():
    symbol = request.args.get("symbol")
    from_date = request.args.get("from")
    to_date = request.args.get("to")

    if not symbol:
        return jsonify({"error": "Symbol is required."}), 400

    try:
        data = get_company_news_data(symbol, from_date, to_date)
        # Handle specific errors from service layer
        if isinstance(data, dict) and "error" in data:
            if "Rate limit exceeded" in data["error"]:
                return jsonify(data), 429
            return jsonify(data), 500
        return jsonify(data)
    except RuntimeError as e: # Catch exceptions raised by rate limits in service
        return jsonify({"error": str(e)}), 429
    except Exception as e:
        print(f"Error in company_news_api for {symbol}: {e}")
        return jsonify({"error": f"An unexpected server error occurred for {symbol}: {e}"}), 500

@news_bp.route("/api/market-news", methods=["GET"])
def market_news_api():
    category = request.args.get("category", "general")
    try:
        data = get_general_news_data(category)
        if isinstance(data, dict) and "error" in data:
            if "Rate limit exceeded" in data["error"]:
                return jsonify(data), 429
            return jsonify(data), 500
        return jsonify(data)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 429
    except Exception as e:
        print(f"Error in market_news_api: {e}")
        return jsonify({"error": f"An unexpected server error occurred for market news: {e}"}), 500

@news_bp.route("/api/market-holidays", methods=["GET"])
def market_holidays_api():
    exchange = request.args.get("exchange", "US")
    try:
        holidays = get_market_holidays_data(exchange)
        # Note: get_market_holidays_data already handles errors and returns an appropriate format or raises
        return jsonify(holidays)
    except ValueError as e: # Specific error for data format issues from service
        print(f"Error: Invalid data format from Finnhub Market Holiday API: {e}")
        return jsonify({"error": f"Invalid data format received for market holidays: {e}"}), 500
    except RuntimeError as e: # For rate limits or request issues
        print(f"Error fetching market holidays: {e}")
        if "Rate limit exceeded" in str(e):
            return jsonify({"error": str(e)}), 429
        return jsonify({"error": f"Failed to fetch market holidays: {e}"}), 500
    except Exception as e:
        print(f"CRITICAL ERROR in market_holidays_api: {e}", exc_info=True)
        return jsonify({"error": f"An unexpected server error occurred: {e}"}), 500
