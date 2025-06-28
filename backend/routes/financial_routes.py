# routes/financial_routes.py
from flask import Blueprint, request, jsonify
from services.finnhub_service import get_company_profile_data, get_stock_metrics_data
from services.alpha_vantage_service import get_alpha_vantage_financial_data
from services.fred_service import get_fred_series_data # Import the new FRED service

financial_bp = Blueprint('financial_bp', __name__)

@financial_bp.route("/api/company-profile", methods=["GET"])
def company_profile_api():
    symbol = request.args.get("symbol")
    if not symbol:
        return jsonify({"error": "Symbol is required."}), 400

    try:
        data = get_company_profile_data(symbol)
        if not data:
            return jsonify({"error": f"No company profile found for symbol: {symbol}"}), 404
        return jsonify(data)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 429
    except Exception as e:
        print(f"Error fetching company profile for {symbol}: {e}")
        return jsonify({"error": f"Failed to fetch company profile for {symbol}: {e}"}), 500

@financial_bp.route("/api/stock-metrics", methods=["GET"])
def stock_metrics_api():
    symbol = request.args.get("symbol")
    if not symbol:
        return jsonify({"error": "Symbol is required."}), 400

    try:
        data = get_stock_metrics_data(symbol)
        if isinstance(data, dict) and "error" in data:
            return jsonify(data), 500
        if not data or not data.get("metric"):
             return jsonify({"error": f"No fundamental metrics found for symbol: {symbol}"}), 404
        return jsonify(data)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 429
    except Exception as e:
        print(f"Error in stock_metrics_api for {symbol}: {e}")
        return jsonify({"error": f"Failed to fetch fundamental metrics for {symbol}: {e}"}), 500

@financial_bp.route("/api/basic-financials", methods=["GET"])
def basic_financials_api():
    symbol = request.args.get("symbol")
    metric_type = request.args.get("metricType", "overview")

    if not symbol:
        return jsonify({"error": "Symbol is required."}), 400

    alpha_vantage_function = None
    if metric_type.lower() == 'overview':
        alpha_vantage_function = 'OVERVIEW'
    elif metric_type.lower() == 'incomestatement':
        alpha_vantage_function = 'INCOME_STATEMENT'
    elif metric_type.lower() == 'balancesheet':
        alpha_vantage_function = 'BALANCE_SHEET'
    elif metric_type.lower() == 'cashflow':
        alpha_vantage_function = 'CASH_FLOW'
    else:
        return jsonify({"error": f"Invalid metricType: {metric_type}. Supported: overview, incomeStatement, balanceSheet, cashFlow."}), 400

    try:
        data = get_alpha_vantage_financial_data(symbol, alpha_vantage_function)

        if isinstance(data, dict) and "error" in data: # Check for error dictionary from service
            if "Rate Limit Exceeded" in data["error"]:
                return jsonify(data), 429
            elif "invalid API key" in data["error"].lower() or "not a valid" in data["error"].lower():
                return jsonify(data), 401
            elif "symbol" in data["error"].lower() and ("invalid" in data["error"].lower() or "not found" in data["error"].lower()):
                return jsonify(data), 404
            else:
                return jsonify(data), 500

        if not data:
            return jsonify({"error": f"No data returned from Alpha Vantage for {symbol} ({metric_type})."}), 404

        return jsonify(data)
    except RuntimeError as e: # Catch general runtime errors (like rate limit from service)
        return jsonify({"error": str(e)}), 429
    except ValueError as e: # Catch data parsing/validation errors from service
        return jsonify({"error": str(e)}), 400 # Or 500 depending on nature of error
    except Exception as e:
        print(f"Error in basic_financials_api for {symbol} ({metric_type}): {e}")
        return jsonify({"error": f"An unexpected server error occurred in the API endpoint for {symbol}: {e}"}), 500

@financial_bp.route("/api/fred-data", methods=["GET"])
def fred_data_api():
    series_ids_str = request.args.get("series_ids")
    if not series_ids_str:
        return jsonify({"error": "Missing 'series_ids' query parameter."}), 400

    series_ids = [s.strip() for s in series_ids_str.split(',') if s.strip()]

    if not series_ids:
        return jsonify({"error": "No valid series IDs provided."}), 400

    try:
        data = get_fred_series_data(series_ids)
        if not data:
            return jsonify({"message": "No data found for the provided FRED series IDs."}), 404
        return jsonify(data)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 429 # Rate limit or other runtime errors
    except Exception as e:
        print(f"Error fetching FRED data for {series_ids_str}: {e}")
        return jsonify({"error": f"Failed to fetch FRED data: {e}"}), 500

