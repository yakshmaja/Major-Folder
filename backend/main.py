"""
FireSight - FastAPI Backend
Main application entry point with all API endpoints.
"""
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

load_dotenv()

from auth import authenticate_user, create_access_token, verify_token, register_user
from model import load_model, predict_risk, RISK_LABELS
from weather import get_weather
from email_service import send_alert_email
from preprocess import get_heatmap_data
from global_points import get_global_points

# --- Global state ---
app_state = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup."""
    try:
        model, scaler = load_model()
        app_state['model'] = model
        app_state['scaler'] = scaler
        print("[OK] Model loaded successfully")
    except FileNotFoundError:
        print("[WARN] Model not found. Please train the model first:")
        print("   cd backend && uv run python model.py")
        app_state['model'] = None
        app_state['scaler'] = None
    yield
    app_state.clear()


app = FastAPI(
    title="FireSight API",
    description="Forest Fire Risk Prediction using Deep Learning",
    version="1.0.0",
    lifespan=lifespan
)

# CORS - allow local dev and deployed frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request/Response Models ---
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str = ''


class PredictionRequest(BaseModel):
    latitude: float
    longitude: float
    email: str


class WeatherData(BaseModel):
    temperature: float
    humidity: float
    wind_speed: float
    rainfall: float
    description: str
    source: str


class PredictionResponse(BaseModel):
    risk_level: int
    risk_label: str
    confidence: float
    probabilities: dict
    weather: dict
    location: dict
    email_status: dict


# --- Endpoints ---
@app.get("/")
async def root():
    return {
        "app": "FireSight",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": app_state.get('model') is not None
    }


@app.post("/api/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate user and return JWT token."""
    if not authenticate_user(request.username, request.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(request.username)
    return LoginResponse(
        access_token=token,
        username=request.username
    )


@app.post("/api/register")
async def register(request: RegisterRequest):
    """Register a new user account."""
    result = register_user(request.username, request.password, request.name)
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['message'])
    return result


@app.post("/api/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest, username: str = Depends(verify_token)):
    """Predict fire risk for a given location."""
    if app_state.get('model') is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please train the model first."
        )

    # Validate coordinates
    if not (-90 <= request.latitude <= 90):
        raise HTTPException(status_code=400, detail="Invalid latitude")
    if not (-180 <= request.longitude <= 180):
        raise HTTPException(status_code=400, detail="Invalid longitude")

    # Fetch weather data
    weather = await get_weather(request.latitude, request.longitude)

    # Predict fire risk
    prediction = predict_risk(
        app_state['model'],
        app_state['scaler'],
        temp=weather['temperature'],
        humidity=weather['humidity'],
        wind=weather['wind_speed'],
        rain=weather['rainfall']
    )

    # Send email alert
    email_status = send_alert_email(
        to_email=request.email,
        risk_label=prediction['risk_label'],
        confidence=prediction['confidence'],
        weather=weather,
        latitude=request.latitude,
        longitude=request.longitude,
        probabilities=prediction['probabilities']
    )

    return PredictionResponse(
        risk_level=prediction['risk_level'],
        risk_label=prediction['risk_label'],
        confidence=prediction['confidence'],
        probabilities=prediction['probabilities'],
        weather={
            'temperature': weather['temperature'],
            'humidity': weather['humidity'],
            'wind_speed': weather['wind_speed'],
            'rainfall': weather['rainfall'],
            'description': weather.get('description', ''),
            'source': weather.get('source', '')
        },
        location={
            'latitude': request.latitude,
            'longitude': request.longitude
        },
        email_status=email_status
    )


@app.get("/api/heatmap")
async def heatmap(username: str = Depends(verify_token)):
    """Get heatmap data with global risk predictions."""
    locations = []

    # Add global sample points with DNN predictions
    if app_state.get('model') is not None:
        global_pts = get_global_points()
        for pt in global_pts:
            prediction = predict_risk(
                app_state['model'],
                app_state['scaler'],
                temp=pt['temp'],
                humidity=pt['RH'],
                wind=pt['wind'],
                rain=pt['rain']
            )
            locations.append({
                'latitude': pt['latitude'],
                'longitude': pt['longitude'],
                'name': pt.get('name', ''),
                'risk_level': prediction['risk_level'],
                'risk_label': prediction['risk_label'],
                'temp': pt['temp'],
                'RH': pt['RH'],
                'wind': pt['wind'],
                'rain': pt['rain']
            })
    else:
        # Fallback to dataset locations if model not loaded
        locations = get_heatmap_data()

    return {"locations": locations}


@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": app_state.get('model') is not None
    }
