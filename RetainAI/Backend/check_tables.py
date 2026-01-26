import os
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

try:
    # Check Customers
    try:
        df_history = pd.read_sql("SELECT * FROM customers", engine)
        print(f"Customers Table Count: {len(df_history)}")
        print(f"Columns: {list(df_history.columns)}")
    except Exception as e:
        print(f"Error reading customers: {e}")

    # Check Logs
    try:
        with engine.connect() as conn:
            logs = conn.execute(text("SELECT input_data FROM prediction_logs")).fetchall()
            print(f"Prediction Logs Count: {len(logs)}")
            if len(logs) > 0:
                print(f"Sample Log Type: {type(logs[0][0])}")
                print(f"Sample Log Value: {logs[0][0][:50]}")
    except Exception as e:
         print(f"Error reading logs: {e}")

except Exception as e:
    print(f"DB Connection failed: {e}")
