from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

# 1. Base 클래스를 먼저 정의하여 임포트 꼬임 방지
class Base(DeclarativeBase):
  pass


DATABASE_URL = "sqlite+aiosqlite:///./app.db"

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(
    autocommit=False, autoflush=False, bind=engine
)


async def get_db():
  async with AsyncSessionLocal() as session:
    yield session