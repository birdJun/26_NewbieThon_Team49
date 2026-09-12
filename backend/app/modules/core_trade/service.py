from datetime import datetime, timedelta, timezone
from app.core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from app.modules.core_trade.models import Item, ItemStatus, User
from app.modules.core_trade.schemas import (
    ItemCreateRequest,
    ItemResponse,
    ItemStatusUpdateRequest,
    ItemUpdateRequest,
    UserAuthRequest,
    UserResponse,
)
from fastapi import HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession


# 회원가입
async def create_user(
    db: AsyncSession, user_in: UserAuthRequest
) -> UserResponse:
  result = await db.execute(
      select(User).where(User.username == user_in.username)
  )
  if result.scalar_one_or_none():
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="이미 존재하는 아이디입니다.",
    )

  new_user = User(
      username=user_in.username,
      hashed_password=get_password_hash(user_in.password),
  )
  db.add(new_user)
  await db.commit()
  await db.refresh(new_user)
  return UserResponse.model_validate(new_user)


# 로그인
async def authenticate_user(
    db: AsyncSession, user_in: UserAuthRequest
) -> str:
  result = await db.execute(
      select(User).where(User.username == user_in.username)
  )
  user = result.scalar_one_or_none()

  if not user or not verify_password(user_in.password, user.hashed_password):
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="아이디 또는 비밀번호가 일치하지 않습니다.",
    )

  return create_access_token(subject=user.id)


# 물품 등록
async def create_item(
    db: AsyncSession, item_in: ItemCreateRequest, user_id: int
) -> ItemResponse:
  now = datetime.now(timezone.utc)
  expires_at = now + timedelta(days=item_in.unmatched_limit_days)

  new_item = Item(
      seller_id=user_id,
      title=item_in.title,
      description=item_in.description,
      price=item_in.price,
      image_url=item_in.image_url,
      location_name=item_in.location_name,
      registered_at=now,
      expires_at=expires_at,
      status=ItemStatus.AVAILABLE,
      disposal_notified=False,
  )
  db.add(new_item)
  await db.commit()
  await db.refresh(new_item)
  return ItemResponse.model_validate(new_item)


# 물품 목록
async def get_items(
    db: AsyncSession,
    status_filter: ItemStatus | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[ItemResponse]:
  query = select(Item).order_by(desc(Item.registered_at))
  if status_filter:
    query = query.where(Item.status == status_filter)

  query = query.offset(offset).limit(limit)
  result = await db.execute(query)
  items = result.scalars().all()
  return [ItemResponse.model_validate(item) for item in items]


# 물품 상세
async def get_item_by_id(db: AsyncSession, item_id: int) -> ItemResponse:
  result = await db.execute(select(Item).where(Item.id == item_id))
  item = result.scalar_one_or_none()
  if not item:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="해당 물품을 찾을 수 없습니다.",
    )
  return ItemResponse.model_validate(item)


# 나눔 예약 — 구매자는 AVAILABLE 상태의 다른 사람 글만 예약할 수 있다.
async def reserve_item(
    db: AsyncSession, item_id: int, current_user_id: int
) -> ItemResponse:
  result = await db.execute(select(Item).where(Item.id == item_id))
  item = result.scalar_one_or_none()

  if not item:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="해당 물품을 찾을 수 없습니다.",
    )
  if item.seller_id == current_user_id:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="내가 올린 물품은 예약할 수 없습니다.",
    )
  if item.status != ItemStatus.AVAILABLE:
    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="이미 예약되었거나 나눔이 종료된 물품입니다.",
    )

  item.status = ItemStatus.RESERVED
  item.reserved_by_id = current_user_id
  await db.commit()
  await db.refresh(item)
  return ItemResponse.model_validate(item)


async def cancel_reservation(
    db: AsyncSession, item_id: int, current_user_id: int
) -> ItemResponse:
  result = await db.execute(select(Item).where(Item.id == item_id))
  item = result.scalar_one_or_none()
  if not item:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 물품을 찾을 수 없습니다.")
  if item.reserved_by_id != current_user_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="예약을 취소할 권한이 없습니다.")
  if item.status != ItemStatus.RESERVED:
    raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="현재 예약 상태가 아닙니다.")

  item.status = ItemStatus.AVAILABLE
  item.reserved_by_id = None
  await db.commit()
  await db.refresh(item)
  return ItemResponse.model_validate(item)



async def update_item(
    db: AsyncSession, item_id: int, item_in: ItemUpdateRequest, current_user_id: int
) -> ItemResponse:
  result = await db.execute(select(Item).where(Item.id == item_id))
  item = result.scalar_one_or_none()
  if not item:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 물품을 찾을 수 없습니다.")
  if item.seller_id != current_user_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="물품 수정 권한이 없습니다.")

  for field, value in item_in.model_dump(exclude_unset=True).items():
    setattr(item, field, value)
  await db.commit()
  await db.refresh(item)
  return ItemResponse.model_validate(item)


async def delete_item(db: AsyncSession, item_id: int, current_user_id: int) -> None:
  result = await db.execute(select(Item).where(Item.id == item_id))
  item = result.scalar_one_or_none()
  if not item:
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="해당 물품을 찾을 수 없습니다.")
  if item.seller_id != current_user_id:
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="물품 삭제 권한이 없습니다.")

  await db.delete(item)
  await db.commit()


# 상태 변경
async def update_item_status(
    db: AsyncSession,
    item_id: int,
    status_in: ItemStatusUpdateRequest,
    current_user_id: int,
) -> ItemResponse:
  result = await db.execute(select(Item).where(Item.id == item_id))
  item = result.scalar_one_or_none()

  if not item:
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="해당 물품을 찾을 수 없습니다.",
    )
  if item.seller_id != current_user_id:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="물품 상태 변경 권한이 없습니다.",
    )

  item.status = status_in.status
  await db.commit()
  await db.refresh(item)
  return ItemResponse.model_validate(item)
