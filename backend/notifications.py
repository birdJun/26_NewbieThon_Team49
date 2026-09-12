from fastapi import APIRouter

router = APIRouter()

# 임시 저장소 (진짜 데이터베이스는 나중에, 지금은 리스트로 충분)
notifications = []

@router.post("/notifications")
def create_notification(message: str):
    notifications.append(message)
    return {"status": "ok"}

@router.get("/notifications")
def get_notifications():
    return {"data": notifications}

@router.delete("/notifications")
def clear_notifications():
    notifications.clear()
    return {"status": "cleared"}