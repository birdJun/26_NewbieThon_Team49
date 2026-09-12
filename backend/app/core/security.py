from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Union
from app.core.config import settings
import bcrypt
import jwt


def get_password_hash(password: str) -> str:
  # bcrypt는 최대 72바이트까지만 처리하므로 바이트 단위로 안전하게 자름
  pwd_bytes = password.encode("utf-8")[:72]
  salt = bcrypt.gensalt()
  hashed = bcrypt.hashpw(pwd_bytes, salt)
  return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
  pwd_bytes = plain_password.encode("utf-8")[:72]
  hashed_bytes = hashed_password.encode("utf-8")
  return bcrypt.checkpw(pwd_bytes, hashed_bytes)


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
  if expires_delta:
    expire = datetime.now(timezone.utc) + expires_delta
  else:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

  to_encode = {"exp": expire, "sub": str(subject)}
  return jwt.encode(
      to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
  )