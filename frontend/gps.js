// GPS로 현재 위치 좌표 받기
function getCurrentLocation() {
  navigator.geolocation.getCurrentPosition(function(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    console.log("좌표:", lat, lng);
    // 이후에 이 좌표를 카카오 API로 넘겨서 주소로 변환하는 코드 추가 예정
  }, function(error) {
    console.error("위치 가져오기 실패:", error);
  });
}