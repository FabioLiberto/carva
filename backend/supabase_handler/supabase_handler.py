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

    def get_public_key(self, kid):
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
