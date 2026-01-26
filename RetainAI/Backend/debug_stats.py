import os
import json
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Connecting to {DATABASE_URL}")

engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        # Check logs
        logs_result = conn.execute(text("SELECT input_data, prediction FROM prediction_logs"))
        logs = logs_result.fetchall()
        print(f"Found {len(logs)} logs.")
        
        for i, row in enumerate(logs):
            try:
                # row[0] should be a string based on schemas
                raw_json = row[0]
                print(f"Row {i} raw data ({type(raw_json)}): {raw_json[:50]}...")
                
                # Manual parsing test
                if isinstance(raw_json, str):
                    data = json.loads(raw_json)
                    print(f"Parsed JSON successfully")
                elif isinstance(raw_json, dict):
                    print(f"Data is already a dict (Auto-conversion)")
            except Exception as e:
                print(f"Error parsing row {i}: {e}")
                
except Exception as e:
    print(f"Database Error: {e}")
