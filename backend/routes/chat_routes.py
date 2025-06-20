# routes/chat_routes.py
from flask import Blueprint, request, jsonify
import json
from services.openrouter_service import chat_with_openrouter_model
from services.finnhub_service import get_stock_quote, get_company_news_data, get_stock_metrics_data
from services.alpha_vantage_service import get_alpha_vantage_financial_data
from config import Config

chat_bp = Blueprint('chat_bp', __name__)

@chat_bp.route("/api/chat", methods=["POST"])
def chat_with_gpt_api():
    try:
        data = request.get_json()
        user_message = data.get("message")
        conversation_history = data.get("history", [])

        if not user_message:
            return jsonify({"error": "Message is required."}), 400

        # Define tool definitions (can also be loaded from config or a dedicated tool file)
        tool_definitions = [
            {
                "type": "function",
                "function": {
                    "name": "get_stock_quote",
                    "description": "Obtiene el precio de cotización actual de la acción desde Finnhub.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "symbol": { "type": "string", "description": "Símbolo bursátil, por ejemplo: NVO" }
                        },
                        "required": ["symbol"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_company_news",
                    "description": "Obtiene noticias recientes de una empresa con su símbolo.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "symbol": { "type": "string" },
                            "from_date": { "type": "string" },
                            "to_date": { "type": "string" }
                        },
                        "required": ["symbol"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_general_market_news",
                    "description": "Obtiene noticias generales del mercado de valores por categoría. Categorías comunes incluyen 'general', 'forex', 'crypto', 'merger'. Por defecto es 'general'.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "category": { "type": "string", "description": "Categoría de noticias, por ejemplo: general, forex, crypto, merger." }
                        },
                        "required": []
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_fundamentals",
                    "description": "Obtiene métricas fundamentales de una empresa (desde Finnhub).",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "symbol": { "type": "string" }
                        },
                        "required": ["symbol"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_basic_financials",
                    "description": "Obtiene datos financieros básicos de una empresa, incluyendo información general, estado de resultados, balance general o estado de flujo de efectivo (desde Alpha Vantage).",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "symbol": { "type": "string", "description": "Símbolo bursátil de la empresa." },
                            "metric_type": {
                                "type": "string",
                                "description": "Tipo de dato financiero a obtener. Puede ser 'overview' (información general y métricas clave), 'incomeStatement' (estado de resultados), 'balanceSheet' (balance general) o 'cashFlow' (estado de flujo de efectivo). Por defecto es 'overview'.",
                                "enum": ["overview", "incomeStatement", "balanceSheet", "cashFlow"]
                            }
                        },
                        "required": ["symbol"]
                    }
                }
            }
        ]

        # First call to the LLM
        message_from_llm = chat_with_openrouter_model(user_message, conversation_history, tool_definitions)

        # Check if the LLM requested a tool call
        if isinstance(message_from_llm, dict) and "tool_calls" in message_from_llm:
            tool_outputs = []
            for tool_call in message_from_llm["tool_calls"]:
                fn_name = tool_call["function"]["name"]
                args = json.loads(tool_call["function"]["arguments"])

                result = {"error": f"Unknown tool: {fn_name}"}

                try:
                    if fn_name == "get_stock_quote":
                        result = get_stock_quote(args["symbol"])
                    elif fn_name == "get_company_news":
                        result = get_company_news_data(args["symbol"], args.get("from_date"), args.get("to_date"))
                    elif fn_name == "get_general_market_news":
                        result = get_general_news_data(args.get("category", "general"))
                    elif fn_name == "get_fundamentals":
                        result = get_stock_metrics_data(args["symbol"])
                    elif fn_name == "get_basic_financials":
                        result = get_alpha_vantage_financial_data(args["symbol"], args.get("metric_type", "OVERVIEW").upper())
                    
                    # Convert any errors from service functions to a dictionary with an "error" key
                    if isinstance(result, dict) and "error" in result:
                        tool_outputs.append({
                            "role": "tool",
                            "tool_call_id": tool_call["id"],
                            "name": fn_name,
                            "content": json.dumps(result)
                        })
                    else:
                        tool_outputs.append({
                            "role": "tool",
                            "tool_call_id": tool_call["id"],
                            "name": fn_name,
                            "content": json.dumps(result)
                        })

                except Exception as e:
                    tool_outputs.append({
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "name": fn_name,
                        "content": json.dumps({"error": f"Error executing tool '{fn_name}': {e}"})
                    })

            # Prepare for followup call with tool outputs
            followup_messages_payload = messages_payload + [message_from_llm] + tool_outputs
            final_response = chat_with_openrouter_model(user_message, followup_messages_payload[1:], tool_definitions) # Pass all previous messages, skipping system prompt for simplicity in this recursive call

            return jsonify({"response": final_response})

        # If no tool calls, return the direct message content
        return jsonify({"response": message_from_llm})

    except ValueError as e: # Catch validation errors (e.g., missing API key)
        print(f"Validation Error in chat_with_gpt_api: {e}")
        return jsonify({"error": str(e)}), 400
    except RuntimeError as e: # Catch errors from service layer (e.g., API call failures)
        print(f"Runtime Error in chat_with_gpt_api: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        print(f"An unexpected error occurred in chat_with_gpt_api: {e}", exc_info=True)
        return jsonify({"error": f"An unexpected server error occurred: {e}"}), 500

