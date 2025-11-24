from fastapi import FastAPI, Response, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from datetime import date as Date, time as Time
from typing import Optional
from supabase_handler.supabase_handler import supabase_handler

class ActivityCreate(BaseModel):
    route: str = Field(..., description="Route or path taken for the activity", example="Central Park Loop")
    time: Time = Field(..., description="Duration of the activity", example="01:30:00")
    distance: int = Field(..., description="Distance covered in meters", example=5000, gt=0)
    date: Date = Field(..., description="Date when the activity took place", example="2025-11-24")
    avgSpeed: int = Field(..., description="Average speed in meters per second", example=2, gt=0)
    title: str = Field(..., description="Title or name of the activity", example="Morning Run")

    class Config:
        json_schema_extra = {
            "example": {
                "route": "Central Park Loop",
                "time": "01:30:00",
                "distance": 5000,
                "date": "2025-11-24",
                "avgSpeed": 2,
                "title": "Morning Run"
            }
        }

class ActivityUpdate(BaseModel):
    route: Optional[str] = Field(None, description="Route or path taken for the activity", example="Central Park Loop")
    time: Optional[Time] = Field(None, description="Duration of the activity", example="01:30:00")
    distance: Optional[int] = Field(None, description="Distance covered in meters", example=5000, gt=0)
    date: Optional[Date] = Field(None, description="Date when the activity took place", example="2025-11-24")
    avgSpeed: Optional[int] = Field(None, description="Average speed in meters per second", example=2, gt=0)
    title: Optional[str] = Field(None, description="Title or name of the activity", example="Morning Run")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Evening Jog",
                "distance": 7500
            }
        }

class ActivityResponse(BaseModel):
    id: int = Field(..., description="Unique identifier for the activity", example=1)
    route: str = Field(..., description="Route or path taken for the activity", example="Central Park Loop")
    time: Time = Field(..., description="Duration of the activity", example="01:30:00")
    distance: int = Field(..., description="Distance covered in meters", example=5000)
    date: Date = Field(..., description="Date when the activity took place", example="2025-11-24")
    avgSpeed: int = Field(..., description="Average speed in meters per second", example=2)
    title: str = Field(..., description="Title or name of the activity", example="Morning Run")
    user_reference: str = Field(..., description="User ID who created this activity")

    class Config:
        json_schema_extra = {
            "example": {
                "id": 1,
                "route": "Central Park Loop",
                "time": "01:30:00",
                "distance": 5000,
                "date": "2025-11-24",
                "avgSpeed": 2,
                "title": "Morning Run",
                "user_reference": "123e4567-e89b-12d3-a456-426614174000"
            }
        }

tags_metadata = [
    {
        "name": "Authentication",
        "description": "Operations for user authentication including signup and signin.",
    },
    {
        "name": "Activities",
        "description": "Manage user activities. All endpoints require JWT authentication.",
    },
    {
        "name": "Health",
        "description": "Health check endpoints.",
    },
]

app = FastAPI(
    title="Carva API",
    description="API for managing user activities with Supabase authentication",
    version="1.0.0",
    openapi_tags=tags_metadata,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

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

@app.get(
    "/",
    tags=["Health"],
    summary="Health check",
    description="Simple health check endpoint to verify the API is running.",
    responses={
        200: {
            "description": "API is running",
            "content": {
                "application/json": {
                    "example": {"Hello": "World"}
                }
            }
        }
    }
)
def read_root():
    return {"Hello": "World"}

@app.post(
    "/signup/",
    tags=["Authentication"],
    summary="User signup",
    description="Create a new user account with email and password.",
    responses={
        200: {
            "description": "User created successfully",
            "content": {
                "application/json": {
                    "example": {
                        "user": {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "email": "user@example.com"
                        },
                        "session": {
                            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                            "token_type": "bearer"
                        }
                    }
                }
            }
        }
    }
)
def sign_up(email: str, password: str):
    response = supabase.sign_up_user(email, password)
    return response

@app.post(
    "/signin/",
    tags=["Authentication"],
    summary="User signin",
    description="Authenticate a user and receive a JWT access token.",
    responses={
        200: {
            "description": "User authenticated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "user": {
                            "id": "123e4567-e89b-12d3-a456-426614174000",
                            "email": "user@example.com"
                        },
                        "session": {
                            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                            "token_type": "bearer"
                        }
                    }
                }
            }
        }
    }
)
def sign_in(email: str, password: str):
    response = supabase.sign_in_user(email, password)
    return response

@app.get(
    "/protected/",
    tags=["Authentication"],
    summary="Protected route example",
    description="Example endpoint that requires JWT authentication. Returns the decoded user claims from the JWT token.",
    responses={
        200: {
            "description": "User claims retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "user_claims": {
                            "sub": "123e4567-e89b-12d3-a456-426614174000",
                            "email": "user@example.com",
                            "aud": "authenticated"
                        }
                    }
                }
            }
        },
        403: {
            "description": "Invalid or missing JWT token"
        }
    }
)
def protected_route(user_claims: dict = Depends(JWTBearer())):
    # user_claims come from supabase_handler.verify_jwt
    return {"user_claims": user_claims}

@app.post(
    "/activities/",
    response_model=ActivityResponse,
    tags=["Activities"],
    summary="Create activity",
    description="Create a new activity for the authenticated user. Requires JWT authentication.",
    responses={
        200: {
            "description": "Activity created successfully"
        },
        401: {
            "description": "Invalid or missing authentication"
        },
        403: {
            "description": "Invalid JWT token"
        },
        500: {
            "description": "Failed to create activity"
        }
    }
)
def create_activity(activity: ActivityCreate, user_claims: dict = Depends(JWTBearer())):
    user_id = user_claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    activity_data = activity.model_dump()
    activity_data["time"] = activity_data["time"].isoformat()
    activity_data["date"] = activity_data["date"].isoformat()

    result = supabase.create_activity(activity_data, user_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create activity")
    return result

@app.get(
    "/activities/",
    tags=["Activities"],
    summary="Get all activities",
    description="Retrieve all activities for the authenticated user. Requires JWT authentication.",
    responses={
        200: {
            "description": "Activities retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "activities": [
                            {
                                "id": 1,
                                "route": "Central Park Loop",
                                "time": "01:30:00",
                                "distance": 5000,
                                "date": "2025-11-24",
                                "avgSpeed": 2,
                                "title": "Morning Run",
                                "user_reference": "123e4567-e89b-12d3-a456-426614174000"
                            }
                        ]
                    }
                }
            }
        },
        401: {
            "description": "Invalid or missing authentication"
        },
        403: {
            "description": "Invalid JWT token"
        }
    }
)
def get_activities(user_claims: dict = Depends(JWTBearer())):
    user_id = user_claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    activities = supabase.get_user_activities(user_id)
    return {"activities": activities}

@app.get(
    "/activities/{activity_id}",
    response_model=ActivityResponse,
    tags=["Activities"],
    summary="Get activity by ID",
    description="Retrieve a specific activity by its ID. The activity must belong to the authenticated user.",
    responses={
        200: {
            "description": "Activity retrieved successfully"
        },
        401: {
            "description": "Invalid or missing authentication"
        },
        403: {
            "description": "Invalid JWT token"
        },
        404: {
            "description": "Activity not found or doesn't belong to the user"
        }
    }
)
def get_activity(activity_id: int, user_claims: dict = Depends(JWTBearer())):
    user_id = user_claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    activity = supabase.get_activity_by_id(activity_id, user_id)
    if not activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    return activity

@app.put(
    "/activities/{activity_id}",
    response_model=ActivityResponse,
    tags=["Activities"],
    summary="Update activity",
    description="Update an existing activity. The activity must belong to the authenticated user. Only provided fields will be updated.",
    responses={
        200: {
            "description": "Activity updated successfully"
        },
        401: {
            "description": "Invalid or missing authentication"
        },
        403: {
            "description": "Invalid JWT token"
        },
        404: {
            "description": "Activity not found or doesn't belong to the user"
        }
    }
)
def update_activity(activity_id: int, activity: ActivityUpdate, user_claims: dict = Depends(JWTBearer())):
    user_id = user_claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    activity_data = activity.model_dump(exclude_unset=True)
    if "time" in activity_data and activity_data["time"]:
        activity_data["time"] = activity_data["time"].isoformat()
    if "date" in activity_data and activity_data["date"]:
        activity_data["date"] = activity_data["date"].isoformat()

    result = supabase.update_activity(activity_id, activity_data, user_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    return result

@app.delete(
    "/activities/{activity_id}",
    tags=["Activities"],
    summary="Delete activity",
    description="Delete an activity by its ID. The activity must belong to the authenticated user.",
    responses={
        200: {
            "description": "Activity deleted successfully",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Activity deleted successfully",
                        "data": []
                    }
                }
            }
        },
        401: {
            "description": "Invalid or missing authentication"
        },
        403: {
            "description": "Invalid JWT token"
        }
    }
)
def delete_activity(activity_id: int, user_claims: dict = Depends(JWTBearer())):
    user_id = user_claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")

    result = supabase.delete_activity(activity_id, user_id)
    return {"message": "Activity deleted successfully", "data": result}