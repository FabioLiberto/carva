from fastapi import FastAPI, Response
from supabase_handler.supabase_handler import supabase_handler

app = FastAPI()

supabase: supabase_handler = supabase_handler()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/signup/")
def sign_up(email: str, password: str):
    response = supabase.sign_up_user(email, password)
    return response

@app.post("/signin/")
def sign_in(email: str, password: str):
    response = supabase.sign_in_user(email, password)
    return response