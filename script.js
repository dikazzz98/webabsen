// Data Storage
let siswaData = JSON.parse(localStorage.getItem('siswaData')) || [];
let absensiData = JSON.parse(localStorage.getItem('absensiData')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let kelasList = ['10 TKJ', '10 RPL', '10 MM', '11 TKJ', '11 RPL', '11 MM', '12 TKJ', '12 RPL', '12 MM'];
let lastAutoUpdate = localStorage.getItem('lastAutoUpdate') || '';

// Demo data
const demoGuru = { username: 'guru', password: 'guru123', role: 'guru', nama: 'Guru Admin' };
const demoSiswa = { username: 'siswa1', password: 'siswa123', role: 'siswa', nama: 'Andi Pratama', kelas: '12 TKJ' };

// ========== FITUR NOTIFIKASI WHATSAPP ==========
const NOMOR_GURU = '085321851127';

// Fungsi untuk mengirim notifikasi WhatsApp
function sendAbsenceNotification(siswaId, status, tanggal) {
    const siswa = siswaData.find(s => s.id === siswaId);
    if (!siswa) {
        console.log('Data siswa tidak ditemukan');
        return false;
    }

    if (!siswa.waOrtu) {
        console.log('Nomor WhatsApp orang tua tidak tersedia untuk:', siswa.nama);
        return false;
    }

    const formattedDate = formatTanggal(tanggal);
    
    // Pesan notifikasi
    const message = `*NOTIFIKASI ABSENSI SISWA*

Nama Siswa: ${siswa.nama}
Kelas: ${siswa.kelas}
Tanggal: ${formattedDate}
Status: ${status}

Sistem Absensi Digital dikaXNet
*Pesan ini dikirim otomatis*`;

    // Encode message untuk URL
    const encodedMessage = encodeURIComponent(message);
    
    // Buat URL WhatsApp
    const whatsappURL = `https://api.whatsapp.com/send?phone=${NOMOR_GURU}&text=${encodedMessage}`;
    
    // Buka WhatsApp di tab baru
    window.open(whatsappURL, '_blank');
    
    console.log('Notifikasi WhatsApp siap dikirim untuk:', siswa.nama);
    return true;
}

// Fungsi untuk mengirim notifikasi massal
function sendBulkNotifications() {
    const today = new Date().toISOString().split('T')[0];
    const absentStudents = absensiData.filter(absensi => 
        absensi.tanggal === today && absensi.status !== 'HADIR'
    );

    if (absentStudents.length === 0) {
        alert('Tidak ada siswa yang absen hari ini.');
        return;
    }

    // Filter siswa yang memiliki nomor WhatsApp
    const studentsWithWA = absentStudents.filter(absensi => {
        const siswa = siswaData.find(s => s.id === absensi.siswaId);
        return siswa && siswa.waOrtu;
    });

    if (studentsWithWA.length === 0) {
        alert('Tidak ada siswa yang absen dengan nomor WhatsApp terdaftar.');
        return;
    }

    if (confirm(`Kirim notifikasi untuk ${studentsWithWA.length} siswa yang absen hari ini?`)) {
        studentsWithWA.forEach((absensi, index) => {
            setTimeout(() => {
                sendAbsenceNotification(absensi.siswaId, absensi.status, today);
            }, index * 3000); // Delay 3 detik antara setiap notifikasi
        });
        
        alert(`Notifikasi akan dikirim untuk ${studentsWithWA.length} siswa. Pastikan browser tidak memblokir pop-up.`);
    }
}

// Fungsi test notifikasi
function testNotification() {
    if (siswaData.length === 0) {
        alert('Tidak ada data siswa untuk testing.');
        return;
    }

    const siswa = siswaData[0]; // Ambil siswa pertama untuk testing
    const today = new Date().toISOString().split('T')[0];
    
    if (!siswa.waOrtu) {
        alert('Siswa pertama tidak memiliki nomor WhatsApp. Silakan tambahkan nomor WhatsApp di data siswa.');
        return;
    }

    if (confirm(`Test notifikasi untuk ${siswa.nama}?`)) {
        sendAbsenceNotification(siswa.id, 'TEST', today);
    }
}

// ========== END FITUR NOTIFIKASI ==========

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Add demo data if not exists
    if (siswaData.length === 0) {
        siswaData.push({
            id: 1,
            nama: demoSiswa.nama,
            username: demoSiswa.username,
            kelas: demoSiswa.kelas,
            jenisKelamin: 'L',
            password: demoSiswa.password,
            waOrtu: '6281234567890',
            alamat: 'Jl. Contoh No. 123'
        });
        localStorage.setItem('siswaData', JSON.stringify(siswaData));
    }

    checkLoginStatus();
    setupLoginEvents();
});

function checkLoginStatus() {
    if (currentUser) {
        showApp();
    } else {
        showLogin();
    }
}

function setupLoginEvents() {
    // Role selector
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });
}

function login() {
    const role = document.querySelector('.role-btn.active').dataset.role;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (role === 'guru') {
        // Login guru
        if (username === demoGuru.username && password === demoGuru.password) {
            currentUser = demoGuru;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showApp();
        } else {
            alert('Username atau password guru salah!');
        }
    } else {
        // Login siswa - menggunakan username dan password
        const siswa = siswaData.find(s => s.username === username);
        if (siswa && siswa.password === password) {
            currentUser = {
                id: siswa.id,
                username: siswa.username,
                nama: siswa.nama,
                kelas: siswa.kelas,
                role: 'siswa'
            };
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showApp();
        } else {
            alert('Username atau password siswa salah!');
        }
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLogin();
}

function showLogin() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    document.getElementById('loginForm').reset();
    
    // Reset role selector
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('[data-role="guru"]').classList.add('active');
}

function showApp() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
    
    initializeApp();
    setupAutoUpdateSystem();
    loadSiswaData();
    updateStats();
    setupEventListeners();
    startRealTimeClock();
    updateUIBasedOnRole();
}

function updateUIBasedOnRole() {
    const isGuru = currentUser.role === 'guru';
    
    // Update user info
    document.getElementById('userName').textContent = currentUser.nama;
    document.getElementById('userRole').textContent = isGuru ? 'GURU' : 'SISWA';
    document.getElementById('welcomeMessage').textContent = 
        `Selamat datang, ${currentUser.nama} (${isGuru ? 'Guru' : 'Siswa'})`;

    // Show/hide menu items based on role
    if (!isGuru) {
        document.getElementById('dataSiswaMenu').classList.add('disabled');
        document.getElementById('laporanMenu').classList.add('disabled');
        document.getElementById('riwayatMenu').classList.add('disabled');
    } else {
        document.getElementById('dataSiswaMenu').classList.remove('disabled');
        document.getElementById('laporanMenu').classList.remove('disabled');
        document.getElementById('riwayatMenu').classList.remove('disabled');
    }

    // Show/hide actions based on role
    document.getElementById('guruActions').style.display = isGuru ? 'flex' : 'none';
    document.getElementById('siswaAccessMessage').style.display = isGuru ? 'none' : 'block';
    
    // Show/hide table columns based on role
    const selectAllTh = document.getElementById('selectAllTh');
    const aksiTh = document.getElementById('aksiTh');
    if (selectAllTh && aksiTh) {
        selectAllTh.style.display = isGuru ? 'table-cell' : 'none';
        aksiTh.style.display = isGuru ? 'table-cell' : 'none';
    }

    // Show/hide filter for siswa
    document.getElementById('filterKelasGroup').style.display = isGuru ? 'block' : 'none';
    document.getElementById('filterSiswaGroup').style.display = isGuru ? 'none' : 'block';
    
    if (!isGuru) {
        document.getElementById('filterNamaSiswa').value = currentUser.nama;
    }

    // Show/hide laporan access
    document.getElementById('laporanGuruAccess').style.display = isGuru ? 'block' : 'none';
    document.getElementById('laporanSiswaAccess').style.display = isGuru ? 'none' : 'block';

    // Show/hide riwayat access
    document.getElementById('riwayatGuruAccess').style.display = isGuru ? 'block' : 'none';
    document.getElementById('riwayatSiswaAccess').style.display = isGuru ? 'none' : 'block';
}

function initializeApp() {
    // Set tanggal default untuk absensi
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('tanggalAbsensi').value = today;
    
    // Set tanggal default untuk laporan (1 bulan terakhir)
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    document.getElementById('tglMulaiLaporan').value = oneMonthAgo.toISOString().split('T')[0];
    document.getElementById('tglAkhirLaporan').value = today;
    document.getElementById('tglMulaiRiwayat').value = oneMonthAgo.toISOString().split('T')[0];
    document.getElementById('tglAkhirRiwayat').value = today;
    document.getElementById('tglMulaiRiwayatSiswa').value = oneMonthAgo.toISOString().split('T')[0];
    document.getElementById('tglAkhirRiwayatSiswa').value = today;
    
    // Populate kelas dropdowns
    populateKelasDropdowns();
    
    // Auto generate laporan pertama kali
    setTimeout(() => {
        generateLaporan();
        loadRiwayatData();
    }, 1000);
}

function setupAutoUpdateSystem() {
    checkDailyAutoUpdate();
    
    // Cek setiap 30 detik untuk auto update
    setInterval(() => {
        checkDailyAutoUpdate();
        updateStats();
    }, 30000);
}

function checkDailyAutoUpdate() {
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0];
    const today = now.toISOString().split('T')[0];
    
    // Jika sudah lewat 23:59:59 dan belum diupdate hari ini
    if (currentTime >= '23:59:59' && lastAutoUpdate !== today) {
        performAutoUpdate();
    }
}

function performAutoUpdate() {
    const today = new Date().toISOString().split('T')[0];
    
    // Auto set ALPA untuk siswa yang belum diabsen hari ini
    siswaData.forEach(siswa => {
        const sudahAbsen = absensiData.some(absensi => 
            absensi.siswaId === siswa.id && absensi.tanggal === today
        );
        
        if (!sudahAbsen) {
            // Hapus duplikat dulu
            absensiData = absensiData.filter(absensi => 
                !(absensi.siswaId === siswa.id && absensi.tanggal === today)
            );
            
            // Tambah status ALPA
            absensiData.push({
                id: Date.now(),
                siswaId: siswa.id,
                tanggal: today,
                status: 'ALPA',
                catatan: 'Auto-update sistem',
                timestamp: new Date().toISOString()
            });

            // Kirim notifikasi untuk siswa yang ALPA
            if (siswa.waOrtu) {
                setTimeout(() => {
                    sendAbsenceNotification(siswa.id, 'ALPA', today);
                }, 1000);
            }
        }
    });
    
    localStorage.setItem('absensiData', JSON.stringify(absensiData));
    lastAutoUpdate = today;
    localStorage.setItem('lastAutoUpdate', today);
    
    console.log('Auto-update performed at:', new Date().toLocaleString());
}

function startRealTimeClock() {
    function updateClock() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        const dateString = now.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        document.getElementById('currentTime').innerHTML = `
            ${dateString}<br>
            <strong>${timeString}</strong>
        `;
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

function setupEventListeners() {
    // Navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.classList.contains('disabled')) {
                e.preventDefault();
                alert('Akses ditolak! Hanya guru yang dapat mengakses fitur ini.');
                return;
            }
            e.preventDefault();
            const page = this.getAttribute('data-page');
            showPage(page);
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Modal handlers
    document.getElementById('tambahSiswaBtn').addEventListener('click', showTambahSiswaModal);
    document.getElementById('batalTambahSiswa').addEventListener('click', hideTambahSiswaModal);
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });

    // Form submission
    document.getElementById('formTambahSiswa').addEventListener('submit', tambahSiswa);

    // Filter handlers
    document.getElementById('filterKelasSiswa').addEventListener('change', filterSiswa);
    document.getElementById('cariSiswa').addEventListener('input', filterSiswa);
    document.getElementById('filterKelasAbsensi').addEventListener('change', loadAbsensiData);
    document.getElementById('tanggalAbsensi').addEventListener('change', loadAbsensiData);
    document.getElementById('simpanAbsensiBtn').addEventListener('click', simpanAbsensi);
    
    // WhatsApp handlers
    document.getElementById('shareWhatsAppBtn').addEventListener('click', shareLaporanWhatsApp);
    document.getElementById('shareRiwayatWhatsApp').addEventListener('click', shareRiwayatWhatsApp);
    document.getElementById('notifikasiMassalBtn').addEventListener('click', sendBulkNotifications);
    document.getElementById('testNotifikasiBtn').addEventListener('click', testNotification);

    // Checkbox handlers
    document.getElementById('selectAll').addEventListener('change', toggleSelectAll);

    // Auto-generate laporan ketika filter berubah
    document.getElementById('filterKelasLaporan').addEventListener('change', generateLaporan);
    document.getElementById('tglMulaiLaporan').addEventListener('change', generateLaporan);
    document.getElementById('tglAkhirLaporan').addEventListener('change', generateLaporan);

    // Auto-load riwayat ketika filter berubah
    document.getElementById('filterRiwayatBtn').addEventListener('click', loadRiwayatData);
    document.getElementById('filterRiwayatSiswaBtn').addEventListener('click', loadRiwayatSiswa);
}

function showPage(page) {
    // Hide all contents
    document.querySelectorAll('.content').forEach(content => {
        content.style.display = 'none';
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected content and set active nav
    document.getElementById(`${page}-content`).style.display = 'block';
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    document.getElementById('page-title').textContent = 
        document.querySelector(`[data-page="${page}"]`).textContent.trim();
    
    // Load specific data for each page
    switch(page) {
        case 'data-siswa':
            loadSiswaData();
            break;
        case 'absensi':
            loadAbsensiData();
            break;
        case 'laporan':
            generateLaporan();
            break;
        case 'riwayat':
            if (currentUser.role === 'siswa') {
                loadRiwayatSiswa();
            } else {
                loadRiwayatData();
            }
            break;
    }
}

function populateKelasDropdowns() {
    const dropdowns = [
        'filterKelasSiswa',
        'filterKelasAbsensi', 
        'filterKelasLaporan',
        'filterKelasRiwayat'
    ];
    
    dropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.innerHTML = '<option value="">Semua Kelas</option>';
            kelasList.forEach(kelas => {
                dropdown.innerHTML += `<option value="${kelas}">${kelas}</option>`;
            });
        }
    });
}

// SISWA MANAGEMENT
function showTambahSiswaModal() {
    document.getElementById('modalTambahSiswa').style.display = 'flex';
    document.getElementById('formTambahSiswa').reset();
}

function hideTambahSiswaModal() {
    document.getElementById('modalTambahSiswa').style.display = 'none';
}

function tambahSiswa(e) {
    e.preventDefault();
    
    const newSiswa = {
        id: Date.now(),
        nama: document.getElementById('namaSiswa').value,
        username: document.getElementById('usernameSiswa').value,
        kelas: document.getElementById('kelasSiswa').value,
        jenisKelamin: document.getElementById('jenisKelamin').value,
        password: document.getElementById('passwordSiswa').value,
        waOrtu: document.getElementById('waOrtu').value,
        alamat: document.getElementById('alamatSiswa').value
    };
    
    // Cek apakah username sudah digunakan
    const existingSiswa = siswaData.find(s => s.username === newSiswa.username);
    if (existingSiswa) {
        alert('Username sudah digunakan! Silakan pilih username lain.');
        return;
    }
    
    siswaData.push(newSiswa);
    localStorage.setItem('siswaData', JSON.stringify(siswaData));
    
    hideTambahSiswaModal();
    loadSiswaData();
    updateStats();
    alert('Siswa berhasil ditambahkan!');
}

function loadSiswaData() {
    const tbody = document.getElementById('siswaTableBody');
    const filterKelas = document.getElementById('filterKelasSiswa').value;
    const searchTerm = document.getElementById('cariSiswa').value.toLowerCase();
    
    let filteredData = siswaData.filter(siswa => {
        const matchKelas = !filterKelas || siswa.kelas === filterKelas;
        const matchSearch = !searchTerm || 
            siswa.nama.toLowerCase().includes(searchTerm) ||
            siswa.username.toLowerCase().includes(searchTerm);
        return matchKelas && matchSearch;
    });
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>Tidak ada data siswa.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredData.map((siswa, index) => `
        <tr>
            <td><input type="checkbox" class="siswa-checkbox" value="${siswa.id}"></td>
            <td>${index + 1}</td>
            <td>${siswa.nama}</td>
            <td>${siswa.username}</td>
            <td>${siswa.kelas}</td>
            <td>${siswa.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
            <td>${siswa.waOrtu || '<span style="color: #e74c3c;">Belum diisi</span>'}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editSiswa(${siswa.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="hapusSiswa(${siswa.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function filterSiswa() {
    loadSiswaData();
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.siswa-checkbox');
    const selectAll = document.getElementById('selectAll').checked;
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll;
    });
}

function editSiswa(id) {
    const siswa = siswaData.find(s => s.id === id);
    if (siswa) {
        document.getElementById('namaSiswa').value = siswa.nama;
        document.getElementById('usernameSiswa').value = siswa.username;
        document.getElementById('kelasSiswa').value = siswa.kelas;
        document.getElementById('jenisKelamin').value = siswa.jenisKelamin;
        document.getElementById('waOrtu').value = siswa.waOrtu || '';
        document.getElementById('passwordSiswa').value = siswa.password || '';
        document.getElementById('alamatSiswa').value = siswa.alamat || '';
        showTambahSiswaModal();
        // Untuk simplicity, edit akan menimpa data yang sama ID
    }
}

function hapusSiswa(id) {
    if (confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
        siswaData = siswaData.filter(s => s.id !== id);
        localStorage.setItem('siswaData', JSON.stringify(siswaData));
        loadSiswaData();
        updateStats();
        alert('Siswa berhasil dihapus!');
    }
}

// ABSENSI MANAGEMENT
function loadAbsensiData() {
    const tbody = document.getElementById('absensiTableBody');
    const filterKelas = document.getElementById('filterKelasAbsensi').value;
    const tanggal = document.getElementById('tanggalAbsensi').value;
    const isGuru = currentUser.role === 'guru';
    
    let filteredData = siswaData.filter(siswa => {
        if (!isGuru) {
            // Untuk siswa, hanya tampilkan data dirinya sendiri
            return siswa.id === currentUser.id;
        }
        // Untuk guru, filter berdasarkan kelas
        return !filterKelas || siswa.kelas === filterKelas;
    });
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <p>Tidak ada siswa.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredData.map((siswa, index) => {
        const absensiHariIni = absensiData.find(absensi => 
            absensi.siswaId === siswa.id && absensi.tanggal === tanggal
        );
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${siswa.nama}</td>
                <td>${siswa.username}</td>
                <td>${siswa.kelas}</td>
                <td>
                    <div class="attendance-status">
                        <button class="status-btn ${absensiHariIni?.status === 'HADIR' ? 'active' : ''}" 
                                onclick="setStatusAbsensi(${siswa.id}, 'HADIR')">
                            Hadir
                        </button>
                        <button class="status-btn sakit ${absensiHariIni?.status === 'SAKIT' ? 'active' : ''}" 
                                onclick="setStatusAbsensi(${siswa.id}, 'SAKIT')">
                            Sakit
                        </button>
                        <button class="status-btn izin ${absensiHariIni?.status === 'IZIN' ? 'active' : ''}" 
                                onclick="setStatusAbsensi(${siswa.id}, 'IZIN')">
                            Izin
                        </button>
                        <button class="status-btn alpa ${absensiHariIni?.status === 'ALPA' ? 'active' : ''}" 
                                onclick="setStatusAbsensi(${siswa.id}, 'ALPA')">
                            Alpa
                        </button>
                    </div>
                </td>
                <td>
                    <input type="text" class="form-control" 
                           id="catatan-${siswa.id}" 
                           value="${absensiHariIni?.catatan || ''}" 
                           placeholder="Keterangan...">
                </td>
            </tr>
        `;
    }).join('');
}

function setStatusAbsensi(siswaId, status) {
    const tanggal = document.getElementById('tanggalAbsensi').value;
    const catatan = document.getElementById(`catatan-${siswaId}`).value;
    
    // Hapus absensi sebelumnya untuk siswa dan tanggal yang sama
    absensiData = absensiData.filter(absensi => 
        !(absensi.siswaId === siswaId && absensi.tanggal === tanggal)
    );
    
    // Tambah absensi baru
    absensiData.push({
        id: Date.now(),
        siswaId: siswaId,
        tanggal: tanggal,
        status: status,
        catatan: catatan,
        timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('absensiData', JSON.stringify(absensiData));
    
    // Kirim notifikasi jika status bukan HADIR
    if (status !== 'HADIR') {
        const siswa = siswaData.find(s => s.id === siswaId);
        if (siswa && siswa.waOrtu) {
            setTimeout(() => {
                sendAbsenceNotification(siswaId, status, tanggal);
            }, 1000);
        } else {
            console.log('Tidak bisa mengirim notifikasi: nomor WhatsApp tidak tersedia');
        }
    }
    
    loadAbsensiData();
    alert(`Status absensi diperbarui: ${status}${status !== 'HADIR' && siswaData.find(s => s.id === siswaId)?.waOrtu ? '\nNotifikasi akan dikirim ke guru.' : ''}`);
}

function simpanAbsensi() {
    alert('Absensi berhasil disimpan!');
    updateStats();
}

// LAPORAN MANAGEMENT
function generateLaporan() {
    const tbody = document.getElementById('laporanTableBody');
    const filterKelas = document.getElementById('filterKelasLaporan').value;
    const tglMulai = document.getElementById('tglMulaiLaporan').value;
    const tglAkhir = document.getElementById('tglAkhirLaporan').value;
    
    document.getElementById('judulLaporan').textContent = 
        `Menampilkan Laporan untuk Kelas: ${filterKelas || 'Semua Kelas'}`;
    
    let filteredSiswa = siswaData.filter(siswa => {
        return !filterKelas || siswa.kelas === filterKelas;
    });
    
    if (filteredSiswa.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <div class="empty-state">
                        <i class="fas fa-chart-bar"></i>
                        <p>Tidak ada data untuk ditampilkan.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredSiswa.map((siswa, index) => {
        const absensiSiswa = absensiData.filter(absensi => 
            absensi.siswaId === siswa.id && 
            absensi.tanggal >= tglMulai && 
            absensi.tanggal <= tglAkhir
        );
        
        const hadir = absensiSiswa.filter(a => a.status === 'HADIR').length;
        const sakit = absensiSiswa.filter(a => a.status === 'SAKIT').length;
        const izin = absensiSiswa.filter(a => a.status === 'IZIN').length;
        const alpa = absensiSiswa.filter(a => a.status === 'ALPA').length;
        const total = hadir + sakit + izin + alpa;
        const persentase = total > 0 ? Math.round((hadir / total) * 100) : 0;
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${siswa.nama}</td>
                <td>${siswa.username}</td>
                <td>${siswa.kelas}</td>
                <td><span class="badge badge-success">${hadir}</span></td>
                <td><span class="badge badge-warning">${sakit}</span></td>
                <td><span class="badge badge-info">${izin}</span></td>
                <td><span class="badge badge-danger">${alpa}</span></td>
                <td><strong>${persentase}%</strong></td>
            </tr>
        `;
    }).join('');
}

// RIWAYAT MANAGEMENT
function loadRiwayatData() {
    const tbody = document.getElementById('riwayatTableBody');
    const filterKelas = document.getElementById('filterKelasRiwayat').value;
    const tglMulai = document.getElementById('tglMulaiRiwayat').value;
    const tglAkhir = document.getElementById('tglAkhirRiwayat').value;
    
    let filteredData = absensiData.filter(absensi => {
        const siswa = siswaData.find(s => s.id === absensi.siswaId);
        if (!siswa) return false;
        
        const matchKelas = !filterKelas || siswa.kelas === filterKelas;
        const matchTanggal = absensi.tanggal >= tglMulai && absensi.tanggal <= tglAkhir;
        
        return matchKelas && matchTanggal;
    });
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <p>Tidak ada riwayat absensi.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredData.map((absensi, index) => {
        const siswa = siswaData.find(s => s.id === absensi.siswaId);
        if (!siswa) return '';
        
        let statusBadge = '';
        switch(absensi.status) {
            case 'HADIR': statusBadge = '<span class="badge badge-success">HADIR</span>'; break;
            case 'SAKIT': statusBadge = '<span class="badge badge-warning">SAKIT</span>'; break;
            case 'IZIN': statusBadge = '<span class="badge badge-info">IZIN</span>'; break;
            case 'ALPA': statusBadge = '<span class="badge badge-danger">ALPA</span>'; break;
        }
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${siswa.nama}</td>
                <td>${siswa.username}</td>
                <td>${siswa.kelas}</td>
                <td>${formatTanggal(absensi.tanggal)}</td>
                <td>${statusBadge}</td>
                <td>${absensi.catatan || '-'}</td>
                <td>${formatTime(absensi.timestamp)}</td>
            </tr>
        `;
    }).join('');
}

function loadRiwayatSiswa() {
    const tbody = document.getElementById('riwayatTableBody');
    const tglMulai = document.getElementById('tglMulaiRiwayatSiswa').value;
    const tglAkhir = document.getElementById('tglAkhirRiwayatSiswa').value;
    
    let filteredData = absensiData.filter(absensi => {
        const siswa = siswaData.find(s => s.id === absensi.siswaId);
        if (!siswa) return false;
        
        const matchSiswa = siswa.id === currentUser.id;
        const matchTanggal = absensi.tanggal >= tglMulai && absensi.tanggal <= tglAkhir;
        
        return matchSiswa && matchTanggal;
    });
    
    if (filteredData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <p>Tidak ada riwayat absensi.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredData.map((absensi, index) => {
        const siswa = siswaData.find(s => s.id === absensi.siswaId);
        if (!siswa) return '';
        
        let statusBadge = '';
        switch(absensi.status) {
            case 'HADIR': statusBadge = '<span class="badge badge-success">HADIR</span>'; break;
            case 'SAKIT': statusBadge = '<span class="badge badge-warning">SAKIT</span>'; break;
            case 'IZIN': statusBadge = '<span class="badge badge-info">IZIN</span>'; break;
            case 'ALPA': statusBadge = '<span class="badge badge-danger">ALPA</span>'; break;
        }
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td>${siswa.nama}</td>
                <td>${siswa.username}</td>
                <td>${siswa.kelas}</td>
                <td>${formatTanggal(absensi.tanggal)}</td>
                <td>${statusBadge}</td>
                <td>${absensi.catatan || '-'}</td>
                <td>${formatTime(absensi.timestamp)}</td>
            </tr>
        `;
    }).join('');
}

function formatTanggal(tanggal) {
    const [tahun, bulan, hari] = tanggal.split('-');
    return `${hari}/${bulan}/${tahun}`;
}

function formatTime(timestamp) {
    if (!timestamp) return '-';
    return new Date(timestamp).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const hadirHariIni = absensiData.filter(a => a.tanggal === today && a.status === 'HADIR').length;
    
    document.getElementById('totalSiswa').textContent = siswaData.length;
    document.getElementById('totalKelas').textContent = new Set(siswaData.map(s => s.kelas)).size;
    document.getElementById('hadirHariIni').textContent = hadirHariIni;
    document.getElementById('tidakHadir').textContent = siswaData.length - hadirHariIni;
}

function shareLaporanWhatsApp() {
    alert('Fitur share WhatsApp akan membuka aplikasi WhatsApp...');
    // Implementasi share WhatsApp bisa ditambahkan di sini
}

function shareRiwayatWhatsApp() {
    alert('Fitur share WhatsApp akan membuka aplikasi WhatsApp...');
    // Implementasi share WhatsApp bisa ditambahkan di sini
}