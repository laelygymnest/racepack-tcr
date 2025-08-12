let role = "";
let data = JSON.parse(localStorage.getItem("bajuData")) || [];

// Login
document.getElementById("loginBtn").addEventListener("click", () => {
    const pass = document.getElementById("password").value;
    if (pass === "master123") {
        role = "master";
        document.getElementById("formMaster").style.display = "block";
        document.getElementById("formStaff").style.display = "block";
        showMain();
    } else if (pass === "staff123") {
        role = "staff";
        document.getElementById("formStaff").style.display = "block";
        showMain();
    } else {
        document.getElementById("loginError").innerText = "Password salah!";
    }
});

function showMain() {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("mainPage").style.display = "block";
    document.getElementById("userRole").innerText = `Login sebagai: ${role.toUpperCase()}`;
    renderTable();
}

// Tambah Data Master
document.getElementById("addData")?.addEventListener("click", () => {
    const kategori = document.getElementById("kategori").value;
    const bib = document.getElementById("bib").value;
    const nama = document.getElementById("nama").value;
    const size = document.getElementById("size").value;
    const barcode = document.getElementById("barcode").value;
    if (!kategori || !bib || !nama || !size || !barcode) return alert("Lengkapi semua field!");
    data.push({kategori, bib, nama, size, barcode, status:"Belum Diambil", staff:"", pengambil:"", telp:"", idCard:"", ket:""});
    saveData();
});

// Update Data Staff / Master
document.getElementById("updateData")?.addEventListener("click", () => {
    const idx = parseInt(document.getElementById("editIndex").value);
    if (isNaN(idx) || idx < 0 || idx >= data.length) return alert("Index salah!");
    data[idx].status = document.getElementById("status").value;
    data[idx].staff = document.getElementById("staffName").value;
    data[idx].pengambil = document.getElementById("pengambil").value;
    data[idx].telp = document.getElementById("telp").value;
    data[idx].idCard = document.getElementById("idCard").value;
    data[idx].ket = document.getElementById("keterangan").value;
    saveData();
});

// Render Tabel
function renderTable(filter="") {
    const tbody = document.querySelector("#dataTable tbody");
    tbody.innerHTML = "";
    let filtered = data.filter(item => 
        item.bib.includes(filter) || 
        item.nama.toLowerCase().includes(filter.toLowerCase()) || 
        item.barcode.includes(filter)
    );
    filtered.forEach((item, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${i}</td>
                <td>${item.kategori}</td>
                <td>${item.bib}</td>
                <td>${item.nama}</td>
                <td>${item.size}</td>
                <td>${item.barcode}</td>
                <td>${item.status}</td>
                <td>${item.staff}</td>
                <td>${item.pengambil}</td>
                <td>${item.telp}</td>
                <td>${item.idCard}</td>
                <td>${item.ket}</td>
            </tr>
        `;
    });
    updateStockCounter();
}

// Update Stok
function updateStockCounter() {
    let stock = {XS:0,S:0,M:0,L:0,XL:0,XXL:0,XXXL:0};
    let total = 0;
    data.forEach(item => {
        if (item.status !== "Diambil") stock[item.size]++;
        total++;
    });
    let html = `<b>Stok Tersisa:</b><br>`;
    for (let s in stock) html += `${s}: ${stock[s]}<br>`;
    html += `<br><b>Total Data:</b> ${total}`;
    document.getElementById("stockCounter").innerHTML = html;
}

// Save Data
function saveData() {
    localStorage.setItem("bajuData", JSON.stringify(data));
    renderTable();
}

// Search
document.getElementById("search").addEventListener("input", (e) => {
    renderTable(e.target.value);
});
