"""
Weather data service.
Fetches real-time weather from OpenWeather API with fallback to historical data.
"""
import os
import httpx
from dotenv import load_dotenv
from preprocess import get_historical_averages, LAT_MIN, LAT_MAX, LON_MIN, LON_MAX

load_dotenv()

OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', '')
OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"


async def fetch_weather_from_api(lat: float, lon: float) -> dict:
    """Fetch real-time weather from OpenWeather API."""
    if not OPENWEATHER_API_KEY or OPENWEATHER_API_KEY == 'your_openweather_api_key_here':
        raise ValueError("OpenWeather API key not configured")

    params = {
        'lat': lat,
        'lon': lon,
        'appid': OPENWEATHER_API_KEY,
        'units': 'metric'
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(OPENWEATHER_URL, params=params)
        response.raise_for_status()
        data = response.json()

    weather = {
        'temperature': data['main']['temp'],
        'humidity': data['main']['humidity'],
        'wind_speed': data['wind']['speed'],
        'rainfall': data.get('rain', {}).get('1h', 0.0),
        'description': data['weather'][0]['description'],
        'icon': data['weather'][0]['icon'],
        'source': 'OpenWeather API (Real-time)'
    }

    return weather


def fetch_weather_from_historical(lat: float, lon: float) -> dict:
    """Fallback: get weather from historical dataset averages."""
    averages, global_avg = get_historical_averages()

    # Find nearest grid cell
    best_match = None
    min_distance = float('inf')

    for _, row in averages.iterrows():
        dist = ((row['latitude'] - lat) ** 2 + (row['longitude'] - lon) ** 2) ** 0.5
        if dist < min_distance:
            min_distance = dist
            best_match = row

    if best_match is not None and min_distance < 0.5:
        weather = {
            'temperature': round(float(best_match['temp']), 1),
            'humidity': round(float(best_match['RH']), 1),
            'wind_speed': round(float(best_match['wind']), 1),
            'rainfall': round(float(best_match['rain']), 2),
            'description': 'Historical average data',
            'icon': '01d',
            'source': 'Historical Dataset (Fallback)'
        }
    else:
        weather = {
            'temperature': round(global_avg['temp'], 1),
            'humidity': round(global_avg['RH'], 1),
            'wind_speed': round(global_avg['wind'], 1),
            'rainfall': round(global_avg['rain'], 2),
            'description': 'Global historical average',
            'icon': '01d',
            'source': 'Historical Dataset - Global Average (Fallback)'
        }

    return weather


async def get_weather(lat: float, lon: float) -> dict:
    """Get weather data - tries API first, falls back to historical."""
    try:
        weather = await fetch_weather_from_api(lat, lon)
        return weather
    except Exception as e:
        print(f"OpenWeather API failed: {e}. Using historical fallback.")
        weather = fetch_weather_from_historical(lat, lon)
        return weather
