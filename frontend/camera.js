// 카메라/갤러리에서 사진 가져오기
function initPhotoInput() {
  const input = document.getElementById("photoInput");
  input.addEventListener("change", function(event) {
    const file = event.target.files[0];
    console.log("선택된 파일:", file);
    // 이후에 이 file을 백엔드로 전송하는 코드 추가 예정
  });
}