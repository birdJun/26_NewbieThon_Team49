import os
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .waste_fee_config import load_waste_fee_environment

load_waste_fee_environment()


class WasteFeeBase(DeclarativeBase):
    pass


def create_waste_fee_engine(url: str):
    engine = create_engine(url, connect_args={"check_same_thread": False} if url.startswith("sqlite") else {})
    if engine.dialect.name == "sqlite":
        @event.listens_for(engine, "connect")
        def foreign_keys(connection, _):
            connection.execute("PRAGMA foreign_keys=ON")
    return engine


waste_fee_engine = create_waste_fee_engine(os.getenv("DATABASE_URL") or "sqlite:///" + (Path(__file__).resolve().parents[1] / "waste_fee.db").as_posix())
WasteFeeSession = sessionmaker(waste_fee_engine)


def get_waste_fee_session():
    with WasteFeeSession() as session:
        yield session


def restore_waste_fee_db():
    """Restore the committed SQLite schema and seed into an absent database only."""
    import sqlite3
    if waste_fee_engine.dialect.name != 'sqlite' or not waste_fee_engine.url.database:
        raise ValueError('SQLite file database required')
    target = Path(waste_fee_engine.url.database)
    if target.exists():
        raise FileExistsError('Existing database is never overwritten')
    migrations = Path(__file__).resolve().parents[1] / 'migrations'
    with sqlite3.connect(':memory:') as source:
        source.executescript((migrations/'001_waste_fee.sql').read_text(encoding='utf-8'))
        source.executescript((migrations/'waste_fee_seed.sql').read_text(encoding='utf-8'))
        if source.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('Seed integrity check failed')
        target.touch(exist_ok=False)
        with sqlite3.connect(target) as destination:
            source.backup(destination)
