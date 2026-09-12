// 카메라/갤러리에서 사진 가져오기
const input = document.getElementById("photoInput");
const uploadResult = document.getElementById("uploadResult");
const uploadedFiles = document.getElementById("uploadedFiles");

function renderUploadedFiles(files) {
  if (files.length === 0) {
    uploadedFiles.textContent = "업로드된 테스트 파일이 없습니다.";
    return;
  }

  uploadedFiles.innerHTML = files.map(file => `
    <p>
      <a href="http://127.0.0.1:8000${file.url}" target="_blank">${file.filename}</a>
      <button type="button" data-filename="${file.filename}">삭제</button>
    </p>
  `).join("");
}

async function loadUploadedFiles() {
  const response = await fetch("http://127.0.0.1:8000/upload-photo");
  if (!response.ok) throw new Error("업로드 파일 목록을 불러오지 못했습니다.");
  const result = await response.json();
  renderUploadedFiles(result.data);
}

uploadedFiles.addEventListener("click", async function(event) {
  const button = event.target.closest("button[data-filename]");
  if (!button || !confirm("이 테스트 파일을 삭제할까요?")) return;

  const filename = button.dataset.filename;
  const response = await fetch(`http://127.0.0.1:8000/upload-photo/${encodeURIComponent(filename)}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    alert("파일 삭제에 실패했습니다.");
    return;
  }

  await loadUploadedFiles();
});

loadUploadedFiles().catch(error => {
  uploadedFiles.textContent = error.message;
});

input.addEventListener("change", async function(event) {
  const file = event.target.files[0];
  if (!file) return;

  uploadResult.textContent = "사진 업로드 중...";

  try {
    const formData = new FormData();
    formData.append("photo", file);
    const response = await fetch("http://127.0.0.1:8000/upload-photo", {
      method: "POST",
      body: formData
    });

    if (!response.ok) throw new Error("사진 업로드에 실패했습니다.");

    const result = await response.json();
    uploadResult.innerHTML = `
      <a href="http://127.0.0.1:8000${result.url}" target="_blank">업로드 완료: ${result.filename}</a>
      <button id="deletePhotoButton" type="button">삭제</button>
    `;

    document.getElementById("deletePhotoButton").addEventListener("click", async function() {
      if (!confirm("이 테스트 파일을 삭제할까요?")) return;

      const deleteResponse = await fetch(`http://127.0.0.1:8000/upload-photo/${encodeURIComponent(result.filename)}`, {
        method: "DELETE"
      });

      if (!deleteResponse.ok) {
        uploadResult.textContent = "파일 삭제에 실패했습니다.";
        return;
      }

      uploadResult.textContent = "파일이 삭제되었습니다.";
      input.value = "";
      await loadUploadedFiles();
    });
    await loadUploadedFiles();
  } catch (error) {
    uploadResult.textContent = error.message;
  }
});