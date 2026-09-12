from pydantic_settings import BaseSettings


class Settings(BaseSettings):
  PROJECT_NAME: str = "Resource Circulation App"
  API_V1_STR: str = "/api/v1"
  SECRET_KEY: str = "dev-secret-key-change-in-production-1234567890"
  ALGORITHM: str = "HS256"
  ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24


settings = Settings()