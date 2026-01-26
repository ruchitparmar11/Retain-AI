import os
from dotenv import load_dotenv
from sqlalchemy import create_engine,text

# load the  secret variables from the .env file
load_dotenv()

# Get the connection string
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("Error: DATABASE_URL not found in .env file.")
    exit()

print(f"Attempting to connect to: {DATABASE_URL}")

try:
    # Create the databse Engine (The conection manager)
    engine = create_engine(DATABASE_URL)

    #Connect and run a simple "Hello World" query
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 'Database Connection Successful!'"))
        print(result.scalar())
except Exception as e:
    print(f"Error: {e}")