from collections import defaultdict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


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


@router.websocket("/ws/{channel}")
async def websocket_endpoint(websocket: WebSocket, channel: str):
    await manager.connect(channel, websocket)
    try:
        while True:
            message = await websocket.receive_json()
            await manager.broadcast(channel, message)
    except WebSocketDisconnect:
        manager.disconnect(channel, websocket)