let lines = [];

// ===== Upload ảnh & OCR =====
document.getElementById("imageInput").addEventListener("change", async function () {

    const file = this.files[0];
    if (!file) return;

    document.getElementById("results").innerHTML = "Đang đọc ảnh...";

    const { data: { text } } = await Tesseract.recognize(
        file,
        'vie+eng'
    );

    lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);

    localStorage.setItem("zoneData", JSON.stringify(lines));

    document.getElementById("results").innerHTML = "Đã lưu dữ liệu từ ảnh!";
});

// ===== Load dữ liệu từ localStorage khi mở lại =====
window.onload = function () {
    const saved = localStorage.getItem("zoneData");
    if (saved) {
        lines = JSON.parse(saved);
    }
};

// ===== Tìm kiếm động =====
document.getElementById("searchInput").addEventListener("input", function () {

    const query = this.value.trim().toLowerCase();
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (query.length < 2) return;

    const regex = new RegExp(`\\b${query}`, "i");

    lines.forEach(line => {
        if (regex.test(line)) {
            const div = document.createElement("div");
            div.className = "result-item";
            div.innerText = line;
            resultsDiv.appendChild(div);
        }
    });
});

// ===== Xóa dữ liệu =====
document.getElementById("clearBtn").addEventListener("click", function () {
    localStorage.removeItem("zoneData");
    lines = [];
    document.getElementById("results").innerHTML = "Đã xóa dữ liệu!";
});
