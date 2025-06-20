# routes/portfolio_routes.py
from flask import Blueprint, request, jsonify
from services.finnhub_service import get_stock_quote

portfolio_bp = Blueprint('portfolio_bp', __name__)

@portfolio_bp.route("/api/analyze-portfolio", methods=["POST"])
def analyze_portfolio():
    full_data = request.get_json()
    
    if full_data is None:
        return jsonify({"error": "No JSON data received or invalid JSON format. Ensure Content-Type is application/json."}), 400

    if not isinstance(full_data, dict):
        return jsonify({"error": "Invalid top-level JSON format. Expecting a dictionary with 'Assets', 'Transactions', 'Deposits'."}), 400

    assets = full_data.get("Assets", [])
    transactions = full_data.get("Transactions", [])
    deposits = full_data.get("Deposits", [])

    if not isinstance(assets, list):
        return jsonify({"error": "Invalid 'Assets' format. The 'Assets' key must contain a list."}), 400

    processed_assets = []
    for item in assets:
        sym = item.get("Symbol") or item.get("Ticker")
        ci  = item.get("CI")     or item.get("cost_basis", 0) 
        qty = item.get("Holdings") or item.get("holdings", 0)
        
        sector = item.get("Sector") or item.get("sector", "N/A")
        category = item.get("Category") or item.get("category", "N/A")

        if not sym:
            # Optionally log a warning here if needed, but not critical for function
            continue

        try:
            # Use the service function to get the quote
            q = get_stock_quote(sym)
            current = q.get("c") or 0.0
        except RuntimeError as e:
            print(f"Rate limit hit for quote for {sym}: {e}")
            current = 0.0 
        except Exception as e:
            print(f"Error fetching quote for {sym}: {e}")
            current = 0.0

        market_value = current * qty
        pl            = market_value - ci
        pl_pct        = (pl / ci * 100) if ci else None

        processed_assets.append({
            "symbol": sym, # Keeping 'symbol' lowercase as used in frontend, consistent with previous App.jsx
            "holdings": qty,
            "CI": ci,
            "currentPrice": current,
            "marketValue": market_value,
            "profitLoss": round(pl, 2),
            "profitLossPct": round(pl_pct,2) if pl_pct is not None else None,
            "sector": sector,
            "category": category
        })
    
    return jsonify({
        "asset_results": processed_assets,
        "transactions": transactions,
        "deposits": deposits
    })
