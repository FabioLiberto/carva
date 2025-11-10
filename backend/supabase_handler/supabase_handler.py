from supabase import create_client, Client
import os
from dotenv import load_dotenv


class supabase_handler:
    def __init__(self):
        load_dotenv()

        url: str = os.getenv("SUPABASE_URL")
        key: str = os.getenv("SUPABASE_KEY")
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