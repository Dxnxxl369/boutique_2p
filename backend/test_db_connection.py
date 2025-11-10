import os
from dotenv import load_dotenv
import psycopg2
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent

# Load environment variables
load_dotenv(BASE_DIR / '.env')

DB_NAME = os.getenv('DB_NAME')
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD')
DB_HOST = os.getenv('DB_HOST')
DB_PORT = os.getenv('DB_PORT')

print(f"Attempting to connect to PostgreSQL with:")
print(f"  DB_NAME: {DB_NAME}")
print(f"  DB_USER: {DB_USER}")
print(f"  DB_HOST: {DB_HOST}")
print(f"  DB_PORT: {DB_PORT}")
print(f"  DB_PASSWORD: {'*' * len(DB_PASSWORD) if DB_PASSWORD else 'None'}")

try:
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        options='-c client_encoding=UTF8'
    )
    cur = conn.cursor()
    cur.execute("SELECT 1")
    print("Successfully connected to the database!")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error connecting to the database: {e}")
