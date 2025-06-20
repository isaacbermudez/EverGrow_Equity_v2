# services/openrouter_service.py
import requests
import json
from config import Config
from utils.cache import chat_cache, get_cached_data, set_cached_data

def chat_with_openrouter_model(user_message, conversation_history, tool_definitions):
    """
    Interacts with the OpenRouter AI model.
    Handles initial chat, tool calling, and follow-up based on tool outputs.
    """
    if not Config.OPENROUTER_API_KEY or Config.OPENROUTER_API_KEY == "YOUR_OPENROUTER_API_KEY_HERE":
        raise ValueError("OPENROUTER_API_KEY is not set correctly in your environment variables.")

    messages_payload = [
        {"role": "system", "content": Config.DEEPDIVE_SYSTEM_PROMPT.strip()},
        *conversation_history,
        {"role": "user", "content": user_message.strip()}
    ]

    headers = {
        "Authorization": f"Bearer {Config.OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "deepseek/deepseek-chat-v3-0324",
        "messages": messages_payload,
        "tools": tool_definitions,
        "tool_choice": "auto"
    }

    openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
    
    try:
        # First call to OpenRouter
        resp = requests.post(openrouter_url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

        if "choices" not in data or not data["choices"]:
            raise ValueError(f"Unexpected response from OpenRouter: {json.dumps(data, indent=2)}")

        message = data["choices"][0]["message"]

        # Check for tool calls
        if "tool_calls" in message:
            return message # Return message with tool_calls for processing in the route

        return message["content"] # Direct response if no tool calls

    except requests.exceptions.RequestException as e:
        raise RuntimeError(f"Failed to connect to OpenRouter API: {e}")
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse OpenRouter response as JSON: {e}")
    except Exception as e:
        raise RuntimeError(f"An unexpected error occurred during OpenRouter chat: {e}")

