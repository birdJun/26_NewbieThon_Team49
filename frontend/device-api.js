(function () {
  const apiBaseUrl = window.API_BASE_URL || window.location.origin;
  const websocketBaseUrl = apiBaseUrl.replace(/^http/, "ws");

  window.DeviceAPI = {
    async uploadPhoto(file) {
      const body = new FormData();
      body.append("photo", file);
      const response = await fetch(`${apiBaseUrl}/upload-photo`, { method: "POST", body });
      if (!response.ok) throw new Error("사진 업로드에 실패했습니다.");
      return response.json();
    },

    async reverseGeocode(latitude, longitude) {
      const response = await fetch(`${apiBaseUrl}/geocode?lat=${latitude}&lng=${longitude}`);
      if (!response.ok) throw new Error("주소 변환에 실패했습니다.");
      return response.json();
    },

    connect(channel, { onMessage, onStatus } = {}) {
      const socket = new WebSocket(`${websocketBaseUrl}/ws/${encodeURIComponent(channel)}`);
      socket.addEventListener("open", () => onStatus?.("connected"));
      socket.addEventListener("message", event => onMessage?.(JSON.parse(event.data)));
      socket.addEventListener("close", () => onStatus?.("disconnected"));
      socket.addEventListener("error", () => onStatus?.("error"));
      return {
        send(message) { socket.send(JSON.stringify(message)); },
        close() { socket.close(); },
      };
    },
  };
})();