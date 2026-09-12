from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.core.database import Base, engine
from app.modules.core_trade.router import router as core_router
from app.modules.device.router import UPLOAD_DIR, router as device_router
from app.modules.core_trade.scheduler import shutdown_scheduler, start_scheduler
from app.waste_fee_db.app.waste_fee_api import waste_fee_router
from app.waste_fee_db.app.waste_fee_db import restore_waste_fee_db, waste_fee_engine
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

    # 대형폐기물 수수료 DB가 없는 최초 실행 시 마이그레이션/시드로 생성
    if waste_fee_engine.dialect.name == "sqlite":
        waste_fee_db_path = Path(waste_fee_engine.url.database)
        if not waste_fee_db_path.exists():
            restore_waste_fee_db()

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:5501",
        "http://localhost:5501",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(core_router, prefix="/api/v1")
app.include_router(device_router)
app.include_router(waste_fee_router)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

@app.get("/health")
async def health():
    return {"status": "ok"}


# API 아래 경로를 먼저 등록한 뒤, 나머지는 프론트엔드 앱으로 제공한다.
FRONTEND_DIR = Path(__file__).resolve().parents[2] / "frontend"
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
