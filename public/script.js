let lines = [];

// ===== Load dữ liệu từ server khi mở web =====
async function loadData() {
  const res = await fetch("/data");
  const data = await res.json();
  lines = data;
}
loadData();

// ===== Upload ảnh =====
document.getElementById("imageInput").addEventListener("change", async function () {

  const file = this.files[0];
  if (!file) return;

  document.getElementById("results").innerHTML = "Đang OCR...";

  const { data: { text } } = await Tesseract.recognize(file, 'vie+eng');

  lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  await fetch("/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: lines })
  });

  document.getElementById("results").innerHTML = "Đã lưu vào database!";
});

// ===== Search =====
document.getElementById("searchInput").addEventListener("input", function () {

  const q = this.value.trim().toLowerCase();
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  if (q.length < 2) return;

  const regex = new RegExp(`\\b${q}`, "i");

  lines.forEach(line => {
    if (regex.test(line)) {
      const div = document.createElement("div");
      div.className = "result-item";
      div.innerText = line;
      resultsDiv.appendChild(div);
    }
  });
});

// ===== Clear database =====
document.getElementById("clearBtn").addEventListener("click", async function () {

  await fetch("/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: [] })
  });

  lines = [];
  document.getElementById("results").innerHTML = "Đã xóa database!";
});
