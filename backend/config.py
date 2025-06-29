# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration class."""
    FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "YOUR_FINNHUB_API_KEY")
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "YOUR_OPENROUTER_API_KEY_HERE")
    ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY", "YOUR_ALPHA_VANTAGE_API_KEY")
    FRED_API_KEY = os.getenv("FRED_API_KEY", "YOUR_FRED_API_KEY_HERE")

    # Update this line to the correct base URL
    UNUSUALWHALES_API_BASE = os.getenv("UNUSUALWHALES_API_BASE", "https://phx.unusualwhales.com")

    # Remove UNUSUALWHALES_API_KEY if it's not used by their API for this endpoint.
    # If other Unusual Whales endpoints require a key, you might keep it, but it's not needed for the heatmap.
    # UNUSUALWHALES_API_KEY = os.getenv("UNUSUALWHALES_API_KEY") # This line can be removed or commented out

    # API Rate Limits
    GLOBAL_RATE_LIMIT = 60 # requests per minute
    ALPHA_VANTAGE_RATE_LIMIT = 5 # requests per minute
    FRED_RATE_LIMIT = 100 # FRED's default is 1000/day, 100/10 minutes

    # Cache TTLs (in seconds)
    CACHE_TTL_QUOTE = 60
    CACHE_TTL_COMPANY_NEWS = 300
    CACHE_TTL_GENERAL_NEWS = 300
    MARKET_HOLIDAY_CACHE_TTL = 86400 # 24 hours
    CACHE_TTL_COMPANY_PROFILE = 86400
    CACHE_TTL_BASIC_FINANCIALS = 3600
    CACHE_TTL_CHAT = 3600
    CACHE_TTL_FRED = 3600
    CACHE_TTL_SPY_HEATMAP = 900 # 15 minutes - NEW

    # Redis Configuration
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB = int(os.getenv("REDIS_DB", 0))
    REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")

    # DeepDive System Prompt
    DEEPDIVE_SYSTEM_PROMPT = """
Actúa como DeepDive Stocks, un analista de empresas para inversión. Tu tarea es realizar un análisis profesional, exhaustivo y estratégico en español para inversores avanzados. Usa navegación web si está disponible. Evalúa modelo de negocio, noticias recientes, directiva, sector, resiliencia, posición en el mercado, si la empresa es Blue Chip o Multibagger, explicación de variación reciente del precio y el valor intrínseco estimado. Usa tablas con esta estructura exacta para los siguientes bloques:

💰 Rentabilidad
| Indicador | Meta / Esperado | Cumple |
|---|---|---|
| Net Income | Estable o creciente | |
| Net Margin | > 15% | |
| ROE | > 15% | |
| ROA | > 15% | |
| ROIC | > 20% | |

📈 Crecimiento
| Indicador | Meta / Esperado | Cumple |
|---|---|---|
| Revenue (Ingresos) | Estable o creciente | |
| EPS Growth (5 años) | Positivo | |
| Sales Growth (5 años) | > 10% | |
| Long-Term EPS Growth | Positivo | |

📊 Valuación
| Indicador | Meta / Esperado | Cumple |
|---|---|---|
| P/E Ratio | < 20 (o < 25) | |
| PEG Ratio | < 1 | |
| P/B Ratio | < 2 | |

🧮 Solidez Financiera (Deuda y Liquidez)
| Indicador | Meta / Esperado | Cumple |
|---|---|---|
| Net Debt / EBITDA | < 3x | |
| Debt/Equity | < 1 | |
| Quick Ratio | > 1 | |

💸 Dividendos
| Indicador | Meta / Esperado | Cumple |
|---|---|---|
| Dividend Yield | > 0% (si aplica) | |
| Payout Ratio | < 60% | |

Luego asigna un color de semáforo (Verde, Amarillo o Rojo) con justificación clara. Sugiere el perfil de inversor ideal (crecimiento, valor, dividendos, conservador o agresivo) y tipo de inversión (largo/corto plazo). Si hay más de una empresa, haz una comparativa y concluye cuál es más atractiva. Incluye resumen del desempeño en 5 años. Finaliza con 'Fuentes y Fecha de Consulta' con hipervínculos. No uses datos ficticios ni des recomendaciones explícitas. Sé claro, directo y profesional.
"""