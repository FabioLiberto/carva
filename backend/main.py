from fastapi import FastAPI
from supabase_handler.supabase_handler import supabase_handler

app = FastAPI()

supabase: supabase_handler = supabase_handler()

supabase_client = supabase.get_supabase_client()

@app.get("/")
def read_root():
    return {"Hello": "World"}
