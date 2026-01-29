import pandas as pd
from sqlalchemy import create_engine
from dotenv import load_dotenv
import os

# 1. Use your NEW Neon Cloud URL directly here
NEON_DB_URL = "postgresql://neondb_owner:npg_30KBuDTPqlnr@ep-plain-night-ahack73w-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

def upload_to_cloud():
    print("Connecting to Cloud Database...")
    engine = create_engine(NEON_DB_URL)
    
    # Updated to read from LOCAL DATABASE instead of CSV
    load_dotenv()
    LOCAL_DB_URL = os.getenv("DATABASE_URL")
    
    try:
        print("Reading from LOCAL Postgres Database...")
        local_engine = create_engine(LOCAL_DB_URL)
        df = pd.read_sql("SELECT * FROM customers", local_engine)
        
        print(f"Read {len(df)} rows from local DB.")
        
        print(f"Uploading to Neon Cloud...")
        # 3. Upload to Neon (replace 'customers' table)
        df.to_sql('customers', engine, if_exists='replace', index=False)
        print("✅ SUCCESS! Data uploaded to Cloud.")
        
        # Create logs table too
        with engine.connect() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS prediction_logs (
                    id SERIAL PRIMARY KEY,
                    input_data TEXT,
                    prediction INT,
                    risk_score FLOAT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            # Fix for auto-commit if using newer sqlalchemy
            try:
                conn.commit()
            except:
                pass
                
        print("✅ Created prediction_logs table.")

    except Exception as e:
        print(f"❌ Error transferring data: {e}")
        print("Make sure your local database is running and has 'customers' table.")

if __name__ == "__main__":
    upload_to_cloud()
