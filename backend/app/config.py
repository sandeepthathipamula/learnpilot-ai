import os
from functools import lru_cache
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.8-flash"
    request_timeout_seconds: float = 75.0
    database_path: str = str(Path(__file__).resolve().parents[2] / "learnpilot.db")
    upload_directory: str = str(Path(__file__).resolve().parents[2] / "uploads")
    jwt_secret: str = "learnpilot-super-secret-key-2026"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def model_post_init(self, __context):
        # Allow test environments to explicitly clear or override keys
        if "TESTING_NO_API_KEY" in os.environ or os.environ.get("GEMINI_API_KEY") == "":
            self.gemini_api_key = None
        if os.environ.get("GEMINI_MODEL") == "":
            self.gemini_model = "gemini-3.8-flash"

@lru_cache
def get_settings() -> Settings:
    return Settings()
