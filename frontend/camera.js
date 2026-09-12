// 카메라/갤러리에서 사진 가져오기
const input = document.getElementById("photoInput");

input.addEventListener("change", async function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch("http://127.0.0.1:8000/upload-photo", {
    method: "POST",
    body: formData
  });

  const result = await response.json();
  console.log("업로드 결과:", result);
});