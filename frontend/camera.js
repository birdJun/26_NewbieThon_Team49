// 카메라/갤러리에서 사진 가져오기
const input = document.getElementById("photoInput");
input.addEventListener("change", function(event) {
  const file = event.target.files[0];
  console.log("선택된 파일:", file);
});