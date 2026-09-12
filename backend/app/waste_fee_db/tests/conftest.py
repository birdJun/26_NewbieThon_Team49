import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.waste_fee_db import WasteFeeBase


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    @event.listens_for(engine, "connect")
    def enforce_fk(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")
    WasteFeeBase.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    engine.dispose()
