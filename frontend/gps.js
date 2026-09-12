// GPS로 현재 위치 좌표 받기
const btn = document.getElementById("locationBtn");
btn.addEventListener("click", function() {
  navigator.geolocation.getCurrentPosition(function(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    document.getElementById("result").innerText = lat + ", " + lng;
  }, function(error) {
    console.error("위치 가져오기 실패:", error);
  });
});

