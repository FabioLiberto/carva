from fastapi import FastAPI, Response
from supabase_handler.supabase_handler import supabase_handler
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase_handler.supabase_handler import supabase_handler

app = FastAPI()

print("FastAPI server starting up...")

supabase: supabase_handler = supabase_handler()

class JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(self, request: Request):
        print("JWTBearer.__call__ method called")
        print("Request headers:", dict(request.headers))
        credentials: HTTPAuthorizationCredentials = await super().__call__(request)
        print("Credentials received:", credentials)
        if credentials:
            print("Verifying JWT token...")
            try:
                # Delegate auth to supabase_handler
                print("Token to verify:", credentials.credentials)
                payload = supabase.verify_jwt(credentials.credentials)
                return payload
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Invalid JWT: {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid authorization code.",
            )

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

@app.get("/protected/")
def protected_route(user_claims: dict = Depends(JWTBearer())):
    # user_claims come from supabase_handler.verify_jwt
    return {"user_claims": user_claims}