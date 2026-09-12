"""Embed waste_fee_router in the host application; factory is for local verification."""
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .waste_fee_api import waste_fee_router


def create_waste_fee_app(allowed_origins: list[str] | None = None) -> FastAPI:
    waste_fee_app = FastAPI(title="전국 대형폐기물 수수료 조회", version="1.0.0")
    waste_fee_app.include_router(waste_fee_router)
    waste_fee_app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins if allowed_origins is not None else [
            "http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:3000", "http://localhost:5173"],
        allow_credentials=False, allow_methods=["GET"], allow_headers=["Accept", "Content-Type"],
    )

    @waste_fee_app.get("/waste-fees/demo", include_in_schema=False)
    def show_waste_fee_demo():
        return FileResponse(Path(__file__).resolve().parents[1] / "web" / "index.html")

    return waste_fee_app
