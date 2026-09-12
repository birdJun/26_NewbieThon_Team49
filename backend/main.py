import json
import os
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from notifications import router as notifications_router
from realtime import router as realtime_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(notifications_router)
app.include_router(realtime_router)


@app.post("/upload-photo")
async def upload_photo(photo: UploadFile = File(...)):
    if not photo.content_type or not photo.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="이미지 파일만 업로드할 수 있습니다.")

    contents = await photo.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="이미지는 10MB 이하만 업로드할 수 있습니다.")

    extension = os.path.splitext(photo.filename or "")[1].lower() or ".jpg"
    filename = f"{os.urandom(16).hex()}{extension}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    with open(file_path, "wb") as saved_file:
        saved_file.write(contents)

    return {"filename": filename, "url": f"/uploads/{filename}"}


@app.get("/upload-photo")
def get_uploaded_photos():
    filenames = sorted(
        filename
        for filename in os.listdir(UPLOAD_DIR)
        if os.path.isfile(os.path.join(UPLOAD_DIR, filename))
    )
    return {"data": [{"filename": filename, "url": f"/uploads/{filename}"} for filename in filenames]}


@app.delete("/upload-photo/{filename}")
def delete_photo(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.isfile(file_path) or os.path.basename(filename) != filename:
        raise HTTPException(status_code=404, detail="파일을 찾을 수 없습니다.")

    os.remove(file_path)
    return {"status": "deleted", "filename": filename}


@app.get("/geocode")
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

@app.get("/health")
def health():
    return {"status": "ok"}

