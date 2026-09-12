import enum
from datetime import datetime, timezone
from typing import List, Optional
from app.core.database import Base
from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship


class User(Base):
  __tablename__ = "users"

  id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
  username: Mapped[str] = mapped_column(
      String(50), unique=True, index=True, nullable=False
  )
  hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
  fcm_token: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
  created_at: Mapped[datetime] = mapped_column(
      DateTime(timezone=True),
      default=lambda: datetime.now(timezone.utc),
      nullable=False,
  )

  items: Mapped[List["Item"]] = relationship(
      "Item", back_populates="seller", cascade="all, delete-orphan"
  )


class ItemStatus(str, enum.Enum):
  AVAILABLE = "AVAILABLE"
  RESERVED = "RESERVED"
  COMPLETED = "COMPLETED"
  EXPIRED_UNMATCHED = "EXPIRED_UNMATCHED"
  DISPOSAL_PENDING = "DISPOSAL_PENDING"


class Item(Base):
  __tablename__ = "items"

  id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
  seller_id: Mapped[int] = mapped_column(
      Integer, ForeignKey("users.id"), nullable=False
  )

  title: Mapped[str] = mapped_column(String(100), nullable=False)
  description: Mapped[str] = mapped_column(Text, nullable=False)
  price: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
  location_name: Mapped[Optional[str]] = mapped_column(
      String(100), nullable=True
  )

  status: Mapped[ItemStatus] = mapped_column(
      Enum(ItemStatus), default=ItemStatus.AVAILABLE, nullable=False, index=True
  )

  registered_at: Mapped[datetime] = mapped_column(
      DateTime(timezone=True),
      default=lambda: datetime.now(timezone.utc),
      nullable=False,
  )
  expires_at: Mapped[datetime] = mapped_column(
      DateTime(timezone=True), nullable=False, index=True
  )
  disposal_notified: Mapped[bool] = mapped_column(
      Boolean, default=False, nullable=False
  )

  seller: Mapped["User"] = relationship("User", back_populates="items")