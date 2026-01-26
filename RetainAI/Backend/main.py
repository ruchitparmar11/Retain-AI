from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib 
import pandas as pd
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import json
from datetime import datetime
from fastapi.responses import StreamingResponse
import io
import csv

app = FastAPI(title="RetainAI API", version="1.0")

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # React Default Port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models/xgb_model.pkl")
ENCODER_PATH = os.path.join(BASE_DIR, "models/encoders.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "models/features.pkl")

print("Loading Model...")

try:
    model = joblib.load(MODEL_PATH)
    encoders = joblib.load(ENCODER_PATH)
    feature_names = joblib.load(FEATURES_PATH)
    print("Model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    
class CustomerData(BaseModel):
    gender: str
    seniorcitizen: int
    partner: str
    dependents: str
    tenure: int
    phoneservice: str
    multiplelines: str
    internetservice: str
    onlinesecurity: str
    onlinebackup: str
    deviceprotection: str
    techsupport: str
    streamingtv: str
    streamingmovies: str
    contract: str
    paperlessbilling: str
    paymentmethod: str
    monthlycharges: float
    totalcharges: float

@app.get("/")
def home():
    return {"message": "RetainAI API is running!"}

@app.get("/stats")
def get_stats(contract: str = None, internet_service: str = None, senior_citizen: int = None):
    try:
        # Helper to calculate dashboard stats
        load_dotenv()
        DATABASE_URL = os.getenv("DATABASE_URL")
        engine = create_engine(DATABASE_URL)
        
        # --- HISTORICAL DATA ---
        query = "SELECT * FROM customers"
        df_history = pd.read_sql(query, engine)
        
        # Apply Filters to History
        if contract and contract != "All":
            df_history = df_history[df_history['contract'] == contract]
        if internet_service and internet_service != "All":
            df_history = df_history[df_history['internetservice'] == internet_service]
        if senior_citizen is not None and senior_citizen != -1: # -1 for All
            df_history = df_history[df_history['seniorcitizen'] == senior_citizen]

        hist_total = len(df_history)
        hist_churn_count = len(df_history[df_history['churn'] == 'Yes'])
        
        # Clean totalcharges for revenue calculation
        df_history['totalcharges'] = pd.to_numeric(df_history['totalcharges'], errors='coerce').fillna(0)
        hist_revenue_risk = df_history[df_history['churn'] == 'Yes']['totalcharges'].sum()

        # --- LIVE PREDICTION DATA ---
        # Fetch logs to add to the dashboard stats
        try:
            with engine.connect() as conn:
                logs_result = conn.execute(text("SELECT input_data, prediction FROM prediction_logs"))
                logs = logs_result.fetchall()
                
            new_total = 0
            new_churn_count = 0
            new_revenue_risk = 0
            
            for row in logs:
                # row[0] is the input_data string
                data = json.loads(row[0]) 
                pred = row[1]
                
                # Apply Filters to Logs (Manual check since data is JSON)
                if contract and contract != "All" and data.get('contract') != contract:
                    continue
                if internet_service and internet_service != "All" and data.get('internetservice') != internet_service:
                    continue
                if senior_citizen is not None and senior_citizen != -1 and data.get('seniorcitizen') != senior_citizen:
                    continue

                new_total += 1
                
                # Count this as a churner if prediction is 1
                if pred == 1:
                    new_churn_count += 1
                    # Add total charges to risk
                    charges = float(data.get('totalcharges', 0) or 0)
                    new_revenue_risk += charges

        except Exception as e:
            print(f"Error fetching logs for stats: {e}")
            new_total = 0
            new_churn_count = 0
            new_revenue_risk = 0

        # --- AGGREGATE STATS ---
        total_customers = hist_total + new_total
        total_churn = hist_churn_count + new_churn_count
        total_revenue_risk = hist_revenue_risk + new_revenue_risk
        
        print(f"DEBUG STATS: HistCust={hist_total} NewCust={new_total} Total={total_customers}")

        # Calculate Rate
        churn_rate = round((total_churn / total_customers) * 100, 2) if total_customers > 0 else 0

        # Distribution for chart (Contract Type)
        # If filtered by contract, this chart might look boring (1 bar), but still correct.
        contract_counts = df_history['contract'].value_counts()
        churn_by_contract = df_history[df_history['churn'] == 'Yes']['contract'].value_counts()
        
        chart_data = []
        # Ensure we show all relevant categories even if count is 0, or just the ones present
        # If we filter by contract, we might want to change the x-axis? 
        # For now, keeping "Contract" as x-axis is fine, it will just show the selected one.
        for cat in contract_counts.index:
            total = int(contract_counts[cat])
            churned = int(churn_by_contract.get(cat, 0))
            retained = total - churned
            chart_data.append({
                "name": cat,
                "Retained": retained,
                "Churned": churned
            })

        return {
            "total_customers": total_customers,
            "churn_rate": f"{churn_rate}%",
            "revenue_at_risk": f"${total_revenue_risk:,.2f}",
            "chart_data": chart_data
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
def predict_churn(data: CustomerData):
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    input_dict = data.dict()
    df = pd.DataFrame([input_dict])

    for col, le in encoders.items():
        if col in df.columns:
            df[col] = df[col].apply(lambda x: le.transform([x])[0] if x in le.classes_ else 0)
    
    df = df[feature_names]

    prediction = model.predict(df)[0]
    probability = model.predict_proba(df)[0][1]

    return {
        "churn_prediction": int(prediction),
        "risk_score": float(round(probability*100, 2)),
        "risk_level": "High" if probability > 0.7 else ("Medium" if probability > 0.4 else "Low")
    }

@app.get("/feature-importance")
def get_feature_importance():
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    # Get feature importance
    importance = model.feature_importances_
    
    # Create a list of dicts
    feature_importance = []
    for i, feature in enumerate(feature_names):
        feature_importance.append({
            "feature": feature,
            "importance": float(importance[i])
        })
    
    # Sort by importance
    feature_importance.sort(key=lambda x: x['importance'], reverse=True)
    
    return feature_importance[:10]  # Return top 10

# --- DATA STORAGE & HISTORY ---

# Initialize Database Table for History
@app.on_event("startup")
def init_db():
    load_dotenv()
    DATABASE_URL = os.getenv("DATABASE_URL")
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS prediction_logs (
                id SERIAL PRIMARY KEY,
                input_data TEXT,
                prediction INT,
                risk_score FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        conn.commit()

@app.post("/predict_and_save")
def predict_churn_and_save(data: CustomerData):
    if not model:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    input_dict = data.dict()
    df = pd.DataFrame([input_dict])

    # Preprocess
    for col, le in encoders.items():
        if col in df.columns:
            df[col] = df[col].apply(lambda x: le.transform([x])[0] if x in le.classes_ else 0)
    
    df = df[feature_names]

    # Predict
    prediction = int(model.predict(df)[0])
    probability = model.predict_proba(df)[0][1]
    risk_score = float(round(probability*100, 2))

    # Save to DB
    try:
        load_dotenv()
        DATABASE_URL = os.getenv("DATABASE_URL")
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            conn.execute(text("""
                INSERT INTO prediction_logs (input_data, prediction, risk_score, created_at)
                VALUES (:input_data, :prediction, :risk_score, :created_at)
            """), {
                "input_data": json.dumps(input_dict),
                "prediction": prediction,
                "risk_score": risk_score,
                "created_at": datetime.now()
            })
            conn.commit()
    except Exception as e:
        print(f"Error saving to history: {e}")

    return {
        "churn_prediction": prediction,
        "risk_score": risk_score,
        "risk_level": "High" if probability > 0.7 else ("Medium" if probability > 0.4 else "Low")
    }

@app.get("/history")
def get_history():
    load_dotenv()
    DATABASE_URL = os.getenv("DATABASE_URL")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT * FROM prediction_logs ORDER BY created_at DESC LIMIT 10"))
        rows = result.fetchall()
        
    history = []
    for row in rows:
        # Parse the input_data JSON string back to a dict
        data = json.loads(row[1]) 
        history.append({
            "id": row[0],
            "customer": f"{data.get('contract', 'Unknown')} - {data.get('internetservice', 'Unknown')}", # Summary
            "tenure": data.get('tenure', 0),
            "monthly_charges": data.get('monthlycharges', 0),
            "prediction": row[2],
            "risk_score": row[3],
            "date": row[4].strftime("%Y-%m-%d %H:%M")
        })
    
    return history

@app.get("/export")
def export_history():
    load_dotenv()
    DATABASE_URL = os.getenv("DATABASE_URL")
    engine = create_engine(DATABASE_URL)
    
    # Create an in-memory byte buffer
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write Header
    headers = ['Timestamp', 'Prediction', 'Risk Score', 'Contract', 'Internet Service', 'Tenure', 'Monthly Charges']
    writer.writerow(headers)
    
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT created_at, prediction, risk_score, input_data FROM prediction_logs ORDER BY created_at DESC"))
            logs = result.fetchall()
            
            for row in logs:
                # Format: 2026-01-24 10:00:00
                ts = row[0].strftime("%Y-%m-%d %H:%M:%S")
                pred = "Churn" if row[1] == 1 else "Retain"
                score = f"{row[2]}%"
                
                # Parse Input Data
                try:
                    data = json.loads(row[3])
                except:
                    data = {}
                
                contract = data.get('contract', 'N/A')
                internet = data.get('internetservice', 'N/A')
                tenure = data.get('tenure', 0)
                charges = data.get('monthlycharges', 0)
                
                writer.writerow([ts, pred, score, contract, internet, tenure, charges])
                
        output.seek(0)
        
        response = StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv"
        )
        response.headers["Content-Disposition"] = "attachment; filename=prediction_history.csv"
        return response

    except Exception as e:
        print(f"Export Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to export data")