from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials
import os

from app.api.routes import auth

# Initialize FastAPI App
app = FastAPI(title="Smart Finance Tracker API")

# Configure CORS for Frontend React App
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], # Adjust to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env'))

# Initialize Firebase Admin SDK
try:
    firebase_admin.get_app()
except ValueError:
    # App hasn't been initialized yet
    try:
        # Load from .env variables
        cred_dict = {
            "type": os.environ.get("FIREBASE_TYPE"),
            "project_id": os.environ.get("FIREBASE_PROJECT_ID"),
            "private_key_id": os.environ.get("FIREBASE_PRIVATE_KEY_ID"),
            "private_key": os.environ.get("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n'),
            "client_email": os.environ.get("FIREBASE_CLIENT_EMAIL"),
            "client_id": os.environ.get("FIREBASE_CLIENT_ID"),
            "auth_uri": os.environ.get("FIREBASE_AUTH_URI"),
            "token_uri": os.environ.get("FIREBASE_TOKEN_URI"),
            "auth_provider_x509_cert_url": os.environ.get("FIREBASE_AUTH_PROVIDER_X509_CERT_URL"),
            "client_x509_cert_url": os.environ.get("FIREBASE_CLIENT_X509_CERT_URL"),
            "universe_domain": os.environ.get("FIREBASE_UNIVERSE_DOMAIN", "googleapis.com")
        }
        
        # Only initialize if we have the minimum required fields
        if cred_dict["project_id"] and cred_dict["private_key"]:
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin initialized successfully from .env")
        else:
            print("WARNING: Firebase env variables are missing. Initialization skipped.")
    except Exception as e:
        print(f"Error initializing Firebase Admin from .env: {e}")

# Include Routers
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Finance Tracker API"}
