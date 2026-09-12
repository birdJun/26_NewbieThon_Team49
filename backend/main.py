from fastapi import FastAPI
from notifications import router as notifications_router

app = FastAPI()

app.include_router(notifications_router)

@app.get("/health")
def health():
    return {"status": "ok"}

