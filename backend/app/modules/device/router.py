import json
import os
from collections import defaultdict
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import APIRouter, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles

router = APIRouter(tags=["Device"])
UPLOAD_DIR = str(Path(__file__).resolve().parents[3] / "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class ConnectionManager:
    def __init__(self):
        self.connections = defaultdict(set)

    async def connect(self, channel: str, websocket: WebSocket):
        await websocket.accept()
        self.connections[channel].add(websocket)

    def disconnect(self, channel: str, websocket: WebSocket):
        self.connections[channel].discard(websocket)
        if not self.connections[channel]:
            del self.connections[channel]

    async def broadcast(self, channel: str, message: dict):
        disconnected = []
        for websocket in self.connections[channel]:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)
        for websocket in disconnected:
            self.disconnect(channel, websocket)


manager = ConnectionManager()


@router.post("/upload-photo")
async def upload_photo(photo: UploadFile = File(...)):
    if not photo.content_type or not photo.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드할 수 있습니다.")

    contents = await photo.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="이미지는 10MB 이하만 업로드할 수 있습니다.")

    extension = os.path.splitext(photo.filename or "")[1].lower() or ".jpg"
    filename = f"{os.urandom(16).hex()}{extension}"
    with open(os.path.join(UPLOAD_DIR, filename), "wb") as saved_file:
        saved_file.write(contents)
    return {"filename": filename, "url": f"/uploads/{filename}"}


@router.get("/upload-photo")
def get_uploaded_photos():
    filenames = sorted(
        filename for filename in os.listdir(UPLOAD_DIR)
        if os.path.isfile(os.path.join(UPLOAD_DIR, filename))
    )
    return {"data": [{"filename": name, "url": f"/uploads/{name}"} for name in filenames]}


@router.delete("/upload-photo/{filename}")
def delete_photo(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.basename(filename) != filename or not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")
    os.remove(file_path)
    return {"status": "deleted", "filename": filename}


@router.get("/geocode")
def reverse_geocode(lat: float, lng: float):
    query = urlencode({"lat": lat, "lon": lng, "format": "jsonv2"})
    request = Request(
        f"https://nominatim.openstreetmap.org/reverse?{query}",
        headers={"User-Agent": "NewbieThon-Team49/1.0"},
    )
    try:
        with urlopen(request, timeout=10) as response:
            data = json.load(response)
    except Exception as error:
        raise HTTPException(status_code=502, detail="주소 변환 서버에 연결할 수 없습니다.") from error
    return {"latitude": lat, "longitude": lng, "address": data.get("display_name", "주소를 찾을 수 없습니다.")}


@router.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    await manager.connect(channel, websocket)
    try:
        while True:
            await manager.broadcast(channel, await websocket.receive_json())
    except WebSocketDisconnect:
        manager.disconnect(channel, websocket)