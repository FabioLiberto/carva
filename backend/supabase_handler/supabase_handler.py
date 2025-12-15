import os
from dotenv import load_dotenv
from typing import Optional, Dict, Any
import requests
from jose import jwt, JWTError
from supabase import create_client, Client

class supabase_handler:
    def __init__(self):
        load_dotenv()
        url: str = os.getenv("SUPABASE_URL")
        key: str = os.getenv("SUPABASE_KEY")
        
        # Get JWKS from standard Supabase endpoint (for RSA/EC tokens)
        self.jwks_url = f"{url}/auth/v1/.well-known/jwks.json"
        try:
            resp = requests.get(self.jwks_url)
            print(f"Fetched JWKS from {self.jwks_url} - status: {resp.status_code}")
            self.jwks = resp.json()
            # print only the list of kids to avoid dumping full key material
            kids = [k.get("kid") for k in self.jwks.get("keys", [])]
            print("Initial JWKS kids:", kids)
        except Exception as e:
            print(f"Failed to fetch JWKS at startup: {e}")
            self.jwks = {"keys": []}
        self.supabase: Client = create_client(url, key)

    def get_supabase_client(self) -> Client:
        return self.supabase

    def sign_up_user(self, email: str, password: str):
        auth_response = self.supabase.auth.sign_up({
            "email": email,
            "password": password
        })
        return auth_response

    def sign_in_user(self, email: str, password: str):
        auth_response = self.supabase.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        return auth_response

    def get_public_key(self, kid: str) -> Dict[str, Any]:
        print("Getting public key for kid:", kid)
        # show current JWKS kids
        current_kids = [k.get("kid") for k in self.jwks.get("keys", [])]
        print("Current JWKS kids:", current_kids)

        # First try to find the key in current JWKS
        for key in self.jwks.get("keys", []):
            if key.get("kid") == kid:
                print("Found matching key in JWKS")
                return key

        # If not found, refresh JWKS and try again (cache-busting)
        print("Key not found, refreshing JWKS...")
        try:
            resp = requests.get(self.jwks_url, params={"_": os.urandom(4).hex()})
            print(f"Refreshed JWKS fetch status: {resp.status_code}")
            refreshed = resp.json()
            refreshed_kids = [k.get("kid") for k in refreshed.get("keys", [])]
            print("Refreshed JWKS kids:", refreshed_kids)
            # update local cache
            self.jwks = refreshed

            for key in self.jwks.get("keys", []):
                if key.get("kid") == kid:
                    print("Found matching key after refresh")
                    return key
        except Exception as e:
            print(f"Failed to refresh JWKS: {e}")

        raise Exception(f"Matching key not found in JWKS for kid: {kid}")

    def verify_jwt(self, token: str) -> dict:
        try:
            print("Verifying JWT token in supabase_handler...")
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")
            alg = header.get("alg", "RS256")
            print(f"Token header -> kid: {kid}, alg: {alg}")


            # Handle RSA/EC tokens with JWKS
            print("Using JWKS for RSA/EC verification")
            public_key = None
            if kid:
                public_key = self.get_public_key(kid)
                # print only the kid and kty for quick debugging
                print("Using public key for verification -> kid:", public_key.get("kid"), "kty:", public_key.get("kty"))

                # jose accepts either a JWK dict (for RSA/EC) or a secret (for HMAC)
                payload = jwt.decode(
                    token,
                    public_key or None,
                    algorithms=[alg],
                    options={"verify_aud": False}  # set to True and provide audience if used
                )
                print("JWT RSA/EC verification succeeded. Payload keys:", list(payload.keys()))
                return payload  # JWT claims as dict

        except JWTError as e:
            raise Exception(f"JWT verification failed: {e}")
        except Exception as e:
            raise Exception(f"JWT verification error: {e}")

    def create_activity(self, activity_data: dict, user_id: str):
        try:
            activity_data["user_reference"] = user_id
            response = self.supabase.table("activities").insert(activity_data).execute()
            return response.data[0] if isinstance(response.data, list) and len(response.data) > 0 else None
        except Exception as e:
            raise Exception(f"Failed to create activity: {e}")

    def get_user_activities(self, user_id: str):
        try:
            response = self.supabase.table("activities").select("*").eq("user_reference", user_id).execute()
            return response.data
        except Exception as e:
            raise Exception(f"Failed to fetch activities: {e}")

    def get_activity_by_id(self, activity_id: int, user_id: str):
        try:
            response = self.supabase.table("activities").select("*").eq("id", activity_id).eq("user_reference", user_id).execute()
            return response.data[0] if isinstance(response.data, list) and len(response.data) > 0 else None
        except Exception as e:
            raise Exception(f"Failed to fetch activity: {e}")

    def update_activity(self, activity_id: int, activity_data: dict, user_id: str):
        try:
            response = self.supabase.table("activities").update(activity_data).eq("id", activity_id).eq("user_reference", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise Exception(f"Failed to update activity: {e}")

    def delete_activity(self, activity_id: int, user_id: str):
        try:
            response = self.supabase.table("activities").delete().eq("id", activity_id).eq("user_reference", user_id).execute()
            return response.data
        except Exception as e:
            raise Exception(f"Failed to delete activity: {e}")

    # ROUTE management methods
    def create_route(self, route_data: dict):
        try:
            response = self.supabase.table("ROUTE").insert(route_data).execute()
            return response.data[0] if isinstance(response.data, list) and len(response.data) > 0 else None
        except Exception as e:
            raise Exception(f"Failed to create route: {e}")

    def get_route_by_id(self, route_id: int):
        try:
            response = self.supabase.table("ROUTE").select("*").eq("id", route_id).execute()
            return response.data[0] if isinstance(response.data, list) and len(response.data) > 0 else None
        except Exception as e:
            raise Exception(f"Failed to fetch route: {e}")

    def get_all_routes(self):
        try:
            response = self.supabase.table("ROUTE").select("*").execute()
            return response.data
        except Exception as e:
            raise Exception(f"Failed to fetch routes: {e}")

    def update_route(self, route_id: int, route_data: dict):
        try:
            response = self.supabase.table("ROUTE").update(route_data).eq("id", route_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise Exception(f"Failed to update route: {e}")

    def delete_route(self, route_id: int):
        try:
            response = self.supabase.table("ROUTE").delete().eq("id", route_id).execute()
            return response.data
        except Exception as e:
            raise Exception(f"Failed to delete route: {e}")

    # POINTS management methods
    def create_point(self, point_data: dict):
        try:
            response = self.supabase.table("POINTS").insert(point_data).execute()
            return response.data[0] if isinstance(response.data, list) and len(response.data) > 0 else None
        except Exception as e:
            raise Exception(f"Failed to create point: {e}")

    def create_points_batch(self, points_data: list):
        try:
            response = self.supabase.table("POINTS").insert(points_data).execute()
            return response.data
        except Exception as e:
            raise Exception(f"Failed to create points batch: {e}")

    def get_point_by_id(self, point_id: int):
        try:
            response = self.supabase.table("POINTS").select("*").eq("id", point_id).execute()
            return response.data[0] if isinstance(response.data, list) and len(response.data) > 0 else None
        except Exception as e:
            raise Exception(f"Failed to fetch point: {e}")

    def get_points_by_route(self, route_id: int):
        try:
            # Assuming points have a route_id field that links to the route
            response = self.supabase.table("POINTS").select("*").eq("id", route_id).execute()
            return response.data
        except Exception as e:
            raise Exception(f"Failed to fetch points for route: {e}")

    def update_point(self, point_id: int, point_data: dict):
        try:
            response = self.supabase.table("POINTS").update(point_data).eq("id", point_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            raise Exception(f"Failed to update point: {e}")

    def delete_point(self, point_id: int):
        try:
            response = self.supabase.table("POINTS").delete().eq("id", point_id).execute()
            return response.data
        except Exception as e:
            raise Exception(f"Failed to delete point: {e}")

    def delete_points_by_route(self, route_id: int):
        try:
            # Delete all points associated with a route
            response = self.supabase.table("POINTS").delete().eq("id", route_id).execute()
            return response.data
        except Exception as e:
            raise Exception(f"Failed to delete points for route: {e}")
