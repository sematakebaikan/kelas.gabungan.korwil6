const SHEET_ID = '19KJIucJXtp0QWCMO2Wt4_ejvXc5rudW43dBO5nsDIU8';
const JSON_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

const TARGET_CLASSES = [
  "AA304", "AK313", "AK314", "AK315", "AK316", "AK317", 
  "AK332", "AK335", "AK338", "IA307", "IA308", 
  "IK320", "IK321", "IK322", "IK332"
];

function fetchAndParseData() {
  // Gunakan JSONP (Script Tag) untuk menghindari error CORS saat membuka file lokal (file:///)
  window.handleGoogleSheetResponse = function(response) {
    try {
      if (response && response.table) {
        processData(response.table);
      } else {
        throw new Error("Format data tidak valid");
      }
    } catch (error) {
      console.error("Error processing data:", error);
      showError();
    }
  };

  const script = document.createElement('script');
  script.src = `https://docs.google.com/spreadsheets/d/19KJIucJXtp0QWCMO2Wt4_ejvXc5rudW43dBO5nsDIU8/gviz/tq?tqx=responseHandler:handleGoogleSheetResponse`;
  script.onerror = showError;
  document.body.appendChild(script);
}

function showError() {
  const grid = document.getElementById('stats-grid');
  if (grid && grid.innerHTML.includes('Memuat')) {
     grid.innerHTML = '<div class="loading" style="color:#ef4444;">Gagal memuat data. Mohon muat ulang halaman.</div>';
  }
}

function processData(table) {
  // Find column indices
  let nameColIdx = -1;
  
  if (table.cols) {
    for (let i = 0; i < table.cols.length; i++) {
      const colLabel = table.cols[i].label ? table.cols[i].label.toLowerCase() : "";
      if (colLabel.includes("kelas") || colLabel.includes("grup")) {
        classColIdx = i;
      }
      if (colLabel.includes("kehadiran")) {
        attendanceColIdx = i;
      }
      if (colLabel.includes("nama")) {
        nameColIdx = i;
      }
    }
  }
  
  if (classColIdx === -1) classColIdx = 2;
  if (attendanceColIdx === -1) attendanceColIdx = 4;
  if (nameColIdx === -1) nameColIdx = 1;

  const counts = {};
  TARGET_CLASSES.forEach(cls => counts[cls] = { hadir: 0, berhalangan: 0, names: [] });
  let totalHadir = 0;
  let totalBerhalangan = 0;

  if (table.rows) {
    table.rows.forEach(row => {
      if (row.c && row.c[classColIdx] && row.c[attendanceColIdx]) {
        const cls = row.c[classColIdx].v;
        const status = row.c[attendanceColIdx].v || "";
        const name = (row.c[nameColIdx] && row.c[nameColIdx].v) ? row.c[nameColIdx].v : "Anonim";

        if (cls && TARGET_CLASSES.includes(cls)) {
          if (status.includes("Hadir")) {
            counts[cls].hadir++;
            counts[cls].names.push(name);
            totalHadir++;
          } else if (status.includes("Berhalangan")) {
            counts[cls].berhalangan++;
            totalBerhalangan++;
          }
        }
      }
    });
  }

  renderStats(counts, totalHadir, totalBerhalangan);
}

function renderStats(counts, totalHadir, totalBerhalangan) {
  const totalHadirEl = document.getElementById('total-hadir');
  if (totalHadirEl) totalHadirEl.textContent = totalHadir;
  
  const totalBerhalanganEl = document.getElementById('total-berhalangan');
  if (totalBerhalanganEl) totalBerhalanganEl.textContent = totalBerhalangan;

  const grid = document.getElementById('stats-grid');
  grid.innerHTML = ''; 

  TARGET_CLASSES.forEach(cls => {
    const item = document.createElement('div');
    item.className = 'stat-item';
    
    const headerDiv = document.createElement('div');
    headerDiv.className = 'stat-item-header';

    const classDiv = document.createElement('div');
    classDiv.className = 'stat-class';
    classDiv.textContent = cls;

    const badges = document.createElement('div');
    badges.className = 'stat-badges';
    
    const hadirBadge = document.createElement('div');
    hadirBadge.className = 'stat-count count-hadir';
    hadirBadge.title = 'Siap Hadir';
    hadirBadge.textContent = counts[cls].hadir;
    
    badges.appendChild(hadirBadge);

    headerDiv.appendChild(classDiv);
    headerDiv.appendChild(badges);
    item.appendChild(headerDiv);

    // List of names
    if (counts[cls].names.length > 0) {
      const nameList = document.createElement('ul');
      nameList.className = 'stat-names-list';
      counts[cls].names.forEach(n => {
        const li = document.createElement('li');
        li.textContent = n;
        nameList.appendChild(li);
      });
      item.appendChild(nameList);
    }
    
    grid.appendChild(item);
  });
}

// Custom Form Submission Handling
let submitted = false;

document.getElementById('attendance-form').addEventListener('submit', function(e) {
  submitted = true;
  document.getElementById('submit-btn').textContent = "Mengirim...";
  document.getElementById('submit-btn').disabled = true;
});

function onFormSubmitSuccess() {
  const form = document.getElementById('attendance-form');
  form.reset();
  
  document.getElementById('submit-btn').textContent = "Kirim Konfirmasi";
  document.getElementById('submit-btn').disabled = false;
  
  const successMsg = document.getElementById('form-success');
  successMsg.style.display = 'block';
  
  // Refresh data a few seconds after submission
  setTimeout(fetchAndParseData, 2000);
  
  setTimeout(() => {
    successMsg.style.display = 'none';
  }, 5000);
  
  submitted = false;
}

// Initial fetch
fetchAndParseData();

// Poll every 15 seconds
setInterval(fetchAndParseData, 15000);
