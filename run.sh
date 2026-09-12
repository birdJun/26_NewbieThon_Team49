#!/bin/bash
# 비움 FastAPI 개발 서버. 프로젝트 폴더에서 ./run.sh 실행.
cd "$(dirname "$0")"
PORT=8000
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "")

echo ""
echo "  비움 개발 서버가 떴습니다. 끄려면 Ctrl+C"
echo ""
echo "  이 노트북에서   →  http://localhost:$PORT"
[ -n "$IP" ] && echo "  같은 와이파이 폰 →  http://$IP:$PORT"
echo ""
echo "  파일 고치고 브라우저 새로고침하면 바로 반영됩니다."
echo ""

cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
