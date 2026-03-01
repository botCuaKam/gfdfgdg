let lines = [];

const dataInput = document.getElementById("dataInput");
const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");


// ===== Chuẩn hoá chuỗi =====
function normalizeText(str) {
  return str
    .toLowerCase()                    // bỏ hoa thường
    .normalize("NFD")                 // tách dấu
    .replace(/[\u0300-\u036f]/g, "")   // xóa dấu
    .replace(/\s+/g, "");              // xóa khoảng trắng
}


// ===== Cập nhật dữ liệu khi nhập =====
dataInput.addEventListener("input", function () {
  lines = this.value
    .split("\n")
    .filter(line => line.trim() !== "");
});


// ===== Tìm kiếm =====
searchInput.addEventListener("input", function () {

  const query = normalizeText(this.value);
  resultsDiv.innerHTML = "";

  if (query.length === 0) return;

  lines.forEach(line => {

    const normalizedLine = normalizeText(line);

    if (normalizedLine.includes(query)) {
      const div = document.createElement("div");
      div.className = "result-item";
      div.innerText = line; // hiển thị bản gốc
      resultsDiv.appendChild(div);
    }

  });

});
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
