/* FINAL script.js
   - data disimpan di localStorage key: 'racepack_data'
   - stok awal disimpan di localStorage key: 'racepack_stock'
   - akun default:
     master / master123
     tcr  / rahasia123
*/

// ---------- CONFIG ----------
const LS_KEY = 'racepack_data';
const LS_STOCK = 'racepack_stock';

// default user accounts (simple, front-end only)
const USERS = [
  { username: 'master', password: 'master123', role: 'master' },
  { username: 'tcr',  password: 'rahasia123',  role: 'staff' }
];

// sizes that we track
const SIZES = ['XS','S','M','L','XL','XXL','XXXL'];

// default initial stock (can diubah oleh master)
const DEFAULT_STOCK = { XS: 10, S: 20, M: 30, L: 30, XL: 20, XXL: 10, XXXL: 5 };

// columns order (display & storage)
const COLUMNS = ['Kategori','No BIB','Nama Peserta','Size Baju','Barcode','Status','Nama Staff','Nama Pengambil','No HP Pengambil','No ID Card Pengambil','Keterangan'];

// ---------- App state ----------
let DATA = []; // array of objects following COLUMNS order
let STOCK = {}; // object size => initial count
let CURRENT_USER = null; // {username, role}

// ---------- Helpers ----------
function saveData(){
  localStorage.setItem(LS_KEY, JSON.stringify(DATA));
}
function loadData(){
  const raw = localStorage.getItem(LS_KEY);
  if(raw) DATA = JSON.parse(raw);
  else DATA = []; // empty
}
function saveStock(){
  localStorage.setItem(LS_STOCK, JSON.stringify(STOCK));
}
function loadStock(){
  const raw = localStorage.getItem(LS_STOCK);
  if(raw) STOCK = JSON.parse(raw);
  else STOCK = {...DEFAULT_STOCK};
}

// create a new row object from array or from fields
function makeRow(objOrArr){
  const row = {};
  if(Array.isArray(objOrArr)){
    COLUMNS.forEach((col, i) => row[col] = objOrArr[i] || '');
  } else {
    COLUMNS.forEach(col => row[col] = objOrArr[col] || '');
  }
  return row;
}

// compute taken counts per size (based on DATA status)
function computeTakenCounts(){
  const taken = {};
  SIZES.forEach(s => taken[s] = 0);
  DATA.forEach(r => {
    const size = String(r['Size Baju']||'').toUpperCase();
    const status = String(r['Status']||'').toLowerCase();
    if(SIZES.includes(size) && status === 'diambil') taken[size] += 1;
  });
  return taken;
}

// compute summary
function computeSummary(){
  const taken = computeTakenCounts();
  const remaining = {};
  let totalAll = 0, totalTaken = 0;
  SIZES.forEach(s => {
    const init = Number(STOCK[s]||0);
    const t = taken[s] || 0;
    remaining[s] = Math.max(0, init - t);
    totalAll += init;
    totalTaken += t;
  });
  return { taken, remaining, totalAll, totalTaken, totalRemaining: totalAll - totalTaken };
}

// ---------- UI Rendering ----------
function showLogin(){
  document.getElementById('page-login').classList.remove('hidden');
  document.getElementById('page-dashboard').classList.add('hidden');
}
function showDashboard(){
  document.getElementById('page-login').classList.add('hidden');
  document.getElementById('page-dashboard').classList.remove('hidden');
  document.getElementById('current-role').textContent = CURRENT_USER.role.toUpperCase();
  // show/hide master-only parts
  if(CURRENT_USER.role === 'master'){
    document.getElementById('add-entry-section').classList.remove('hidden');
    document.getElementById('master-stock-settings').classList.remove('hidden');
  } else {
    document.getElementById('add-entry-section').classList.add('hidden');
    document.getElementById('master-stock-settings').classList.add('hidden');
  }
  renderStockSummary();
  renderTable(DATA);
  renderStockSettingsForm();
}

// stock summary cards
function renderStockSummary(){
  const wrap = document.getElementById('stock-cards');
  wrap.innerHTML = '';
  const { taken, remaining, totalAll, totalTaken, totalRemaining } = computeSummary();
  SIZES.forEach(s => {
    const div = document.createElement('div');
    div.className = 'stock-item';
    div.innerHTML = `<div>${s}</div><strong>${remaining[s]}</strong><small> (taken ${taken[s]})</small>`;
    wrap.appendChild(div);
  });
  document.getElementById('total-all').textContent = totalAll;
  document.getElementById('total-taken').textContent = totalTaken;
  document.getElementById('total-remaining').textContent = totalRemaining;
}

// render stock settings (master)
function renderStockSettingsForm(){
  const container = document.getElementById('stock-settings-form');
  container.innerHTML = '';
  SIZES.forEach(s => {
    const input = document.createElement('input');
    input.type = 'number';
    input.min = 0;
    input.value = Number(STOCK[s]||0);
    input.id = 'stock-inp-'+s;
    input.style = 'width:85px;margin:4px;';
    const label = document.createElement('label');
    label.style = 'margin-right:6px;';
    label.textContent = s+': ';
    const wrap = document.createElement('div');
    wrap.appendChild(label);
    wrap.appendChild(input);
    container.appendChild(wrap);
  });
  document.getElementById('save-stock').onclick = () => {
    SIZES.forEach(s => {
      const val = Number(document.getElementById('stock-inp-'+s).value || 0);
      STOCK[s] = val;
    });
    saveStock();
    renderStockSummary();
    alert('Stok awal disimpan.');
  };
}

// render table rows
function renderTable(rows){
  const tbody = document.querySelector('#data-table tbody');
  tbody.innerHTML = '';

  rows.forEach((r, idx) => {
    const tr = document.createElement('tr');
    COLUMNS.forEach((col, cidx) => {
      const td = document.createElement('td');

      // if editable for current role: master can edit all; staff only columns 6..11 (Status..Keterangan)
      const staffEditableCols = ['Status','Nama Staff','Nama Pengambil','No HP Pengambil','No ID Card Pengambil','Keterangan'];
      const isMaster = CURRENT_USER.role === 'master';
      const isStaff = CURRENT_USER.role === 'staff';

      if( (isMaster) || (isStaff && staffEditableCols.includes(col)) ){
        // render special input for Status (select)
        if(col === 'Status'){
          const sel = document.createElement('select');
          ['Belum Diambil','Diambil'].forEach(opt => {
            const o = document.createElement('option'); o.value = opt; o.textContent = opt;
            if(String(r[col]||'') === opt) o.selected = true;
            sel.appendChild(o);
          });
          sel.onchange = () => {
            r[col] = sel.value;
            DATA[idx] = r;
            saveData();
            // recompute summary (we compute from scratch)
            renderStockSummary();
            renderTable(DATA); // re-render to update any derived views
          };
          td.appendChild(sel);
        } else {
          const inp = document.createElement('input');
          inp.value = r[col] || '';
          inp.onblur = () => {
            r[col] = inp.value;
            DATA[idx] = r;
            saveData();
            renderStockSummary();
          };
          td.appendChild(inp);
        }
      } else {
        td.textContent = r[col] || '';
      }
      tr.appendChild(td);
    });

    // aksi column
    const actionTd = document.createElement('td');
    // master can delete
    if(CURRENT_USER.role === 'master'){
      const saveBtn = document.createElement('button');
      saveBtn.className = 'table-action-btn save-btn';
      saveBtn.textContent = 'Simpan';
      saveBtn.onclick = () => {
        // if inputs are in cells, already saved on blur; but ensure save
        saveData();
        renderStockSummary();
        alert('Terupdate');
      };
      const delBtn = document.createElement('button');
      delBtn.className = 'table-action-btn del-btn';
      delBtn.textContent = 'Hapus';
      delBtn.onclick = () => {
        if(confirm('Hapus baris ini?')){
          DATA.splice(idx,1);
          saveData();
          renderStockSummary();
          renderTable(DATA);
        }
      };
      actionTd.appendChild(saveBtn);
      actionTd.appendChild(delBtn);
    } else {
      actionTd.textContent = '-';
    }
    tr.appendChild(actionTd);

    tbody.appendChild(tr);
  });
}

// ---------- Events & initialization ----------

// login
document.getElementById('btn-login').addEventListener('click', () => {
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value;
  const user = USERS.find(x => x.username === u && x.password === p);
  if(!user){
    document.getElementById('login-error').classList.remove('hidden');
    return;
  }
  document.getElementById('login-error').classList.add('hidden');
  CURRENT_USER = user;
  // save current to sessionStorage
  sessionStorage.setItem('racepack_user', JSON.stringify(CURRENT_USER));
  showDashboard();
});

// quick fill sample
document.getElementById('btn-sample').addEventListener('click', ()=> {
  if(!confirm('Isi contoh data? akan menimpa data jika ada.')) return;
  DATA = [
    makeRow(['Event','101','Andi','M','BC101','Belum Diambil','','','','','']),
    makeRow(['Event','102','Budi','L','BC102','Diambil','Rika','Budi','0812345678','ID102','']),
    makeRow(['Event','103','Citra','S','BC103','Belum Diambil','','','','','']),
    makeRow(['Event','104','Dewi','XL','BC104','Diambil','Riko','Dewi','081222333','ID104','']),
  ];
  STOCK = {...DEFAULT_STOCK};
  saveData(); saveStock();
  alert('Contoh data dimuat.');
});

// logout
document.getElementById('btn-logout').addEventListener('click', ()=> {
  sessionStorage.removeItem('racepack_user');
  CURRENT_USER = null;
  showLogin();
});

// add new entry (master)
document.getElementById('btn-add').addEventListener('click', ()=>{
  if(!CURRENT_USER || CURRENT_USER.role !== 'master'){ alert('Hanya master yang bisa menambah data.'); return; }
  const obj = {
    'Kategori': document.getElementById('f-kategori').value.trim(),
    'No BIB': document.getElementById('f-no-bib').value.trim(),
    'Nama Peserta': document.getElementById('f-nama').value.trim(),
    'Size Baju': document.getElementById('f-size').value,
    'Barcode': document.getElementById('f-barcode').value.trim(),
    'Status': document.getElementById('f-status').value,
    'Nama Staff': document.getElementById('f-nama-staff').value.trim(),
    'Nama Pengambil': document.getElementById('f-nama-pengambil').value.trim(),
    'No HP Pengambil': document.getElementById('f-nohp').value.trim(),
    'No ID Card Pengambil': document.getElementById('f-idcard').value.trim(),
    'Keterangan': document.getElementById('f-keterangan').value.trim()
  };
  // basic validation
  if(!obj['No BIB'] || !obj['Nama Peserta'] || !obj['Size Baju']){
    alert('Kategori, No BIB, Nama Peserta, dan Size wajib diisi.');
    return;
  }
  DATA.push(makeRow(obj));
  saveData();
  renderTable(DATA);
  renderStockSummary();
  // clear form
  document.getElementById('f-kategori').value='';
  document.getElementById('f-no-bib').value='';
  document.getElementById('f-nama').value='';
  document.getElementById('f-size').value='';
  document.getElementById('f-barcode').value='';
  document.getElementById('f-status').value='Belum Diambil';
  document.getElementById('f-nama-staff').value='';
  document.getElementById('f-nama-pengambil').value='';
  document.getElementById('f-nohp').value='';
  document.getElementById('f-idcard').value='';
  document.getElementById('f-keterangan').value='';
});

// clear form
document.getElementById('btn-clear').addEventListener('click', ()=>{
  ['f-kategori','f-no-bib','f-nama','f-size','f-barcode','f-status','f-nama-staff','f-nama-pengambil','f-nohp','f-idcard','f-keterangan']
  .forEach(id => document.getElementById(id).value = '');
});

// search
document.getElementById('search').addEventListener('input', (e)=>{
  const q = e.target.value.trim().toLowerCase();
  if(!q){ renderTable(DATA); return; }
  const filtered = DATA.filter(r => {
    return String(r['No BIB']||'').toLowerCase().includes(q) ||
           String(r['Nama Peserta']||'').toLowerCase().includes(q) ||
           String(r['Barcode']||'').toLowerCase().includes(q);
  });
  renderTable(filtered);
});

// ---------- Start App ----------
function init(){
  loadData();
  loadStock();
  // restore user session if any
  const raw = sessionStorage.getItem('racepack_user');
  if(raw){
    CURRENT_USER = JSON.parse(raw);
    showDashboard();
  } else {
    showLogin();
  }
}
init();
