from typing import List, Optional
import jwt
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.modules.core_trade import service
from app.modules.core_trade.models import ItemStatus, User
from app.modules.core_trade.schemas import (
    ItemCreateRequest,
    ItemResponse,
    ItemStatusUpdateRequest,
    ItemUpdateRequest,
    TokenResponse,
    UserAuthRequest,
    UserResponse,
)

router = APIRouter()

# Swagger UI에서 토큰(Value)을 직접 입력받는 표준 HTTPBearer 방식
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials  # Bearer 토큰 문자열 추출
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 자격 증명이 유효하지 않거나 만료되었습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


# --- 인증 API ---
@router.post(
    "/auth/signup",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Auth"],
)
async def signup(
    user_in: UserAuthRequest, db: AsyncSession = Depends(get_db)
) -> UserResponse:
    return await service.create_user(db, user_in)


@router.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
async def login(
    user_in: UserAuthRequest, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    access_token = await service.authenticate_user(db, user_in)
    return TokenResponse(access_token=access_token)


@router.get("/auth/me", response_model=UserResponse, tags=["Auth"])
async def read_current_user(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    return UserResponse.model_validate(current_user)


# --- 게시판 API ---
@router.post(
    "/items",
    response_model=ItemResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Items"],
)
async def create_item(
    item_in: ItemCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ItemResponse:
    return await service.create_item(db, item_in, current_user.id)


@router.get("/items", response_model=List[ItemResponse], tags=["Items"])
async def list_items(
    status: Optional[ItemStatus] = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
) -> List[ItemResponse]:
    return await service.get_items(
        db, status_filter=status, limit=limit, offset=offset
    )


@router.get("/items/{item_id}", response_model=ItemResponse, tags=["Items"])
async def get_item(
    item_id: int, db: AsyncSession = Depends(get_db)
) -> ItemResponse:
    return await service.get_item_by_id(db, item_id)



@router.post("/items/{item_id}/reserve", response_model=ItemResponse, tags=["Items"])
async def reserve_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ItemResponse:
    return await service.reserve_item(db, item_id, current_user.id)


@router.delete("/items/{item_id}/reservation", response_model=ItemResponse, tags=["Items"])
async def cancel_reservation(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ItemResponse:
    return await service.cancel_reservation(db, item_id, current_user.id)


@router.patch("/items/{item_id}", response_model=ItemResponse, tags=["Items"])
async def update_item(
    item_id: int,
    item_in: ItemUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ItemResponse:
    return await service.update_item(db, item_id, item_in, current_user.id)


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Items"])
async def delete_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await service.delete_item(db, item_id, current_user.id)


@router.patch(
    "/items/{item_id}/status", response_model=ItemResponse, tags=["Items"]
)
async def update_item_status(
    item_id: int,
    status_in: ItemStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ItemResponse:
    return await service.update_item_status(
        db, item_id, status_in, current_user.id
    )

from app.modules.core_trade.schemas import FCMTokenUpdateRequest  # import 확인


@router.post("/users/me/fcm-token", tags=["Auth"])
async def register_fcm_token(
    body: FCMTokenUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """모바일 앱에서 수신한 FCM 기기 토큰을 현재 유저 정보에 등록"""
    current_user.fcm_token = body.fcm_token
    await db.commit()
    return {"message": "FCM 토큰이 성공적으로 등록되었습니다."}
