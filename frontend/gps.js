// GPS로 현재 위치 좌표 받기
const btn = document.getElementById("locationBtn");
const resultElement = document.getElementById("result");

btn.addEventListener("click", function() {
  resultElement.innerText = "위치를 확인하는 중...";
  navigator.geolocation.getCurrentPosition(function(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    resultElement.innerText = `${lat}, ${lng}\n주소를 확인하는 중...`;

    fetch(`http://127.0.0.1:8000/geocode?lat=${lat}&lng=${lng}`)
      .then(response => {
        if (!response.ok) throw new Error("주소 변환에 실패했습니다.");
        return response.json();
      })
      .then(data => {
        resultElement.innerText = `${data.latitude}, ${data.longitude}\n${data.address}`;
      })
      .catch(error => {
        resultElement.innerText = `${lat}, ${lng}\n${error.message}`;
      });
  }, function(error) {
    resultElement.innerText = `위치 가져오기 실패: ${error.message}`;
  });
});

