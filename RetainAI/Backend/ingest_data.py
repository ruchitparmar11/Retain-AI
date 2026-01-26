import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

URL = "https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv"
print(f"Downloading data from {URL}...")

df = pd.read_csv(URL)
print(f"Data downloaded Shape: {df.shape}")

df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce')
df['TotalCharges'] = df['TotalCharges'].fillna(0.0)

df.columns = df.columns.str.lower().str.replace(" ", "_").str.replace("-", "_")
print(f"Columns cleaned:",list(df.columns[:5]))

TABLE_NAME = "customers"
print(f"Uploading {len(df)} rows to database table '{TABLE_NAME}'...")

df.to_sql(TABLE_NAME, engine, if_exists='replace', index=False)
print("Success! Data is now in PostgreSQL.")