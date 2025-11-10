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