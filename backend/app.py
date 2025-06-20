# app.py (Main Application File)
#This will become the central point to create your Flask app instance and register all the blueprints.
from flask import Flask
from flask_cors import CORS
from config import Config

# Import blueprints
from routes.portfolio_routes import portfolio_bp
from routes.news_routes import news_bp
from routes.financial_routes import financial_bp
from routes.chat_routes import chat_bp

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Register Blueprints
app.register_blueprint(portfolio_bp)
app.register_blueprint(news_bp)
app.register_blueprint(financial_bp)
app.register_blueprint(chat_bp)

if __name__ == "__main__":
    # Print warning if API keys are not set from environment variables
    if not Config.OPENROUTER_API_KEY or Config.OPENROUTER_API_KEY == "YOUR_OPENROUTER_API_KEY_HERE":
        print("WARNING: OPENROUTER_API_KEY is not set or is default. AI chat features may fail.")
    if not Config.FINNHUB_API_KEY or Config.FINNHUB_API_KEY == "YOUR_FINNHUB_API_KEY":
        print("WARNING: FINNHUB_API_KEY is not set or is default. Stock data features may not work.")
    if not Config.ALPHA_VANTAGE_API_KEY or Config.ALPHA_VANTAGE_API_KEY == "YOUR_ALPHA_VANTAGE_API_KEY":
        print("WARNING: ALPHA_VANTAGE_API_KEY is not set or is default. Alpha Vantage features may not work.")

    # Run the Flask development server
    app.run(debug=True, port=5000)

