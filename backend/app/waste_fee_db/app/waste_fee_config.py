from pathlib import Path

from dotenv import load_dotenv


def load_waste_fee_environment() -> None:
    """작업 디렉터리와 무관하게 backend/.env를 읽고 기존 환경변수를 보존한다."""
    load_dotenv(
        dotenv_path=Path(__file__).resolve().parents[1] / ".env",
        override=False,
        encoding="utf-8-sig",
        interpolate=False,
    )
