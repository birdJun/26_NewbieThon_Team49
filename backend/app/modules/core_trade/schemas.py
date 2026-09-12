from datetime import datetime, timezone
from typing import Optional
from app.modules.core_trade.models import ItemStatus
from pydantic import BaseModel, Field, computed_field


class UserAuthRequest(BaseModel):
  username: str = Field(
      ..., min_length=4, max_length=20, description="아이디"
  )
  password: str = Field(..., min_length=4, description="비밀번호")


class UserResponse(BaseModel):
  id: int
  username: str
  created_at: datetime
  model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
  access_token: str
  token_type: str = "bearer"


class ItemCreateRequest(BaseModel):
  title: str = Field(..., min_length=2, max_length=100)
  description: str = Field(...)
  price: int = Field(default=0, ge=0)
  image_url: Optional[str] = None
  location_name: Optional[str] = None
  unmatched_limit_days: int = Field(default=7, ge=1, le=30)


class ItemStatusUpdateRequest(BaseModel):
  status: ItemStatus


class ItemResponse(BaseModel):
  id: int
  seller_id: int
  title: str
  description: str
  price: int
  image_url: Optional[str] = None
  location_name: Optional[str] = None
  status: ItemStatus
  registered_at: datetime
  expires_at: datetime
  disposal_notified: bool

  # 실시간 남은 시간(초)을 동적으로 계산하는 필드
  @computed_field
  def remaining_seconds(self) -> int:
    now = datetime.now(timezone.utc)
    # DB에서 불러온 datetime 객체에 timezone 정보가 없는 경우를 보정
    target = self.expires_at
    if target.tzinfo is None:
      target = target.replace(tzinfo=timezone.utc)

    delta = target - now
    seconds_left = int(delta.total_seconds())
    return max(0, seconds_left)  # 이미 만료되었으면 0 반환

  model_config = {"from_attributes": True}

class FCMTokenUpdateRequest(BaseModel):
  fcm_token: str = Field(..., description="기기에서 발급받은 FCM Push 토큰")