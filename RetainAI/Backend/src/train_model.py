import pandas as pd 
from sqlalchemy import create_engine 
import os
from dotenv import load_dotenv
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
from sklearn.metrics import classification_report
import joblib

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

print("Loading data from Database...")

df = pd.read_sql("SELECT * FROM customers", engine)

df = df.drop(columns=['customerid'])

df['churn'] = df['churn'].apply(lambda x:1 if x == 'Yes' else 0)

categorical_cols = df.select_dtypes(include=['object']).columns

encoders = {}

for col in categorical_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    encoders[col] = le

X = df.drop(columns=['churn'])
y = df['churn']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"Data Processed. Training shape: {X_train.shape}")

print("Training XGBoost Model...")
model = XGBClassifier(use_label_encoder=False,  eval_metric='logloss')
model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print("\n Model Performance:")
print(classification_report(y_test, y_pred))

if not os.path.exists("models"):
    os.makedirs("models")

joblib.dump(model, "models/xgb_model.pkl")
joblib.dump(encoders, "models/encoders.pkl")
joblib.dump(X.columns, "models/features.pkl")

print("\n Model saved to 'backend/models/xgb_model.pkl'")