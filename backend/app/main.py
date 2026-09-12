from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.database import Base, engine
from app.modules.core_trade.router import router as core_router
from app.modules.core_trade.scheduler import shutdown_scheduler, start_scheduler
import logging

# 콘솔에 INFO 레벨 이상의 로그를 모두 출력하도록 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. 시작 시 DB 테이블 자동 생성
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. 백그라운드 만료 체크 스케줄러 가동
    start_scheduler()

    yield

    # 3. 서버 종료 시 스케줄러 정지
    shutdown_scheduler()


app = FastAPI(
    title="Resource Circulation Service - Core Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(core_router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Resource Circulation API Server is Running"}