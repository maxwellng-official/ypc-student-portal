/* ================================================
   CONFIG
   Update API_BASE to your web server URL once deployed.
   While running locally (file://), mock data is used.
   ================================================ */

const API_BASE = './api';


/* ================================================
   SESSION
   ================================================ */

let currentStudent = null;
let currentAdmin   = null;

(function restoreSession() {
  try {
    const savedStudent = sessionStorage.getItem('ypc_student');
    const savedAdmin   = sessionStorage.getItem('ypc_admin');
    if (savedStudent) currentStudent = JSON.parse(savedStudent);
    if (savedAdmin)   currentAdmin   = JSON.parse(savedAdmin);
  } catch (_) {}
})();


/* ================================================
   NAVIGATION
   ================================================ */

function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId)?.classList.add('active');
  window.scrollTo(0, 0);

  // Sync bottom-nav active dot
  const navScreens = ['dashboard', 'attendance', 'results', 'schedule', 'profile'];
  document.querySelectorAll('.nav-item').forEach((item, i) => {
    const isActive = navScreens[i] === screenId;
    item.classList.toggle('active', isActive);
    item.querySelector('.nav-active-dot')?.remove();
    const label = item.querySelector('.nl');
    if (isActive) {
      const dot = document.createElement('div');
      dot.className = 'nav-active-dot';
      item.insertBefore(dot, label);
      if (label) label.style.color = 'var(--cyan)';
    } else {
      if (label) label.style.color = '';
    }
  });

  switch (screenId) {
    case 'dashboard':        loadDashboard();        break;
    case 'attendance':       loadAttendance();       break;
    case 'results':          loadResults();          break;
    case 'schedule':         loadSchedule();         break;
    case 'profile':          loadProfile();          break;
    case 'exam-slip':        loadExamSlips();        break;
    case 'payment':          loadPayments();         break;
    case 'extracurricular':  loadExtracurricular();  break;
    case 'documents':        loadDocuments();        break;
    case 'disciplinary':     loadDisciplinary();     break;
    case 'admin-dashboard':  loadAdminDashboard();   break;
  }
}


/* ================================================
   LIVE CLOCK
   ================================================ */

function updateClock() {
  const t = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  document.querySelectorAll('.js-clock').forEach(el => el.textContent = t);
}
updateClock();
setInterval(updateClock, 10000);


/* ================================================
   DAY TAB SWITCHING
   ================================================ */

document.querySelectorAll('.day-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    renderScheduleDay(this.dataset.day);
  });
});


/* ================================================
   API HELPER
   ================================================ */

async function apiGet(endpoint) {
  const id = currentStudent?.ypc_id || '23BIS12345';
  try {
    const res = await fetch(`${API_BASE}/${endpoint}?ypc_id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[API] ${endpoint}:`, err.message);
    return null;
  }
}


/* ================================================
   LOGIN
   ================================================ */

async function doLogin() {
  const ypcId    = document.getElementById('loginId')?.value?.trim()  || '';
  const password = document.getElementById('loginPass')?.value?.trim() || '';
  const errEl    = document.getElementById('loginError');
  if (errEl) errEl.style.display = 'none';

  try {
    const res  = await fetch(`${API_BASE}/login.php`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ypc_id: ypcId, password }),
    });
    const data = await res.json();

    if (data.success) {
      currentStudent = data.student;
      sessionStorage.setItem('ypc_student', JSON.stringify(currentStudent));
      goTo('dashboard');
      return;
    }
    if (errEl) { errEl.textContent = data.error || 'Login failed'; errEl.style.display = 'block'; }

  } catch (_) {
    // Offline / local file — use mock student
    currentStudent = {
      ypc_id:      ypcId     || '23BIS12345',
      ljmu_id:     'LJMU-23-456789',
      name:        'Maxwell Ng Yi Ken',
      email:       'maxwell@student.ypc.edu.my',
      phone:       '+60 12-345 6789',
      ic_number:   '050312-14-XXXX',
      programme:   'Diploma in Business Information Systems',
      semester:    4,
      cgpa:        3.65,
      intake_date: '2024-01-15',
      status:      'active',
    };
    sessionStorage.setItem('ypc_student', JSON.stringify(currentStudent));
    goTo('dashboard');
  }
}

function doLogout() {
  sessionStorage.removeItem('ypc_student');
  currentStudent = null;
  goTo('login');
}


/* ================================================
   LOGIN MODE TOGGLE
   ================================================ */

function setLoginMode(mode) {
  const isAdmin = mode === 'admin';
  document.getElementById('studentLoginCard').style.display = isAdmin ? 'none' : 'block';
  document.getElementById('adminLoginCard').style.display   = isAdmin ? 'block' : 'none';
  document.getElementById('btnModeStudent').classList.toggle('active', !isAdmin);
  document.getElementById('btnModeAdmin').classList.toggle('active',  isAdmin);
  document.getElementById('loginError').style.display      = 'none';
  document.getElementById('adminLoginError').style.display = 'none';
}


/* ================================================
   ADMIN LOGIN / LOGOUT
   ================================================ */

// Mock admin credentials for offline / local file mode
const MOCK_ADMINS = [
  { username: 'admin',      password: 'admin123',  name: 'System Administrator', role: 'System Administrator' },
  { username: 'registrar',  password: 'reg2026',   name: 'Registrar Office',     role: 'Registrar' },
];

async function doAdminLogin() {
  const username = document.getElementById('adminUser')?.value?.trim() || '';
  const password = document.getElementById('adminPass')?.value?.trim() || '';
  const errEl    = document.getElementById('adminLoginError');
  if (errEl) errEl.style.display = 'none';

  try {
    const res  = await fetch(`${API_BASE}/admin-login.php`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (data.success) {
      currentAdmin = data.admin;
      sessionStorage.setItem('ypc_admin', JSON.stringify(currentAdmin));
      loadAdminDashboard();
      goTo('admin-dashboard');
      return;
    }
    if (errEl) { errEl.textContent = data.error || 'Invalid admin credentials'; errEl.style.display = 'block'; }

  } catch (_) {
    // Offline — check mock credentials
    const match = MOCK_ADMINS.find(a => a.username === username && a.password === password);
    if (match) {
      currentAdmin = { username: match.username, name: match.name, role: match.role };
      sessionStorage.setItem('ypc_admin', JSON.stringify(currentAdmin));
      loadAdminDashboard();
      goTo('admin-dashboard');
    } else {
      if (errEl) { errEl.textContent = 'Invalid admin credentials'; errEl.style.display = 'block'; }
    }
  }
}

function doAdminLogout() {
  sessionStorage.removeItem('ypc_admin');
  currentAdmin = null;
  goTo('login');
}


/* ================================================
   ADMIN DASHBOARD
   ================================================ */

function loadAdminDashboard() {
  if (!currentAdmin) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('adminDisplayName', currentAdmin.name || 'Administrator');
  set('adminDisplayRole', currentAdmin.role || 'Admin');
  // Reset search result
  const result = document.getElementById('adminStudentResult');
  if (result) result.style.display = 'none';
  const errEl = document.getElementById('adminSearchError');
  if (errEl) errEl.style.display = 'none';
}

async function adminSearchStudent() {
  const query  = document.getElementById('adminSearchInput')?.value?.trim() || '';
  const errEl  = document.getElementById('adminSearchError');
  if (errEl) errEl.style.display = 'none';

  if (!query) {
    if (errEl) { errEl.textContent = 'Please enter a Student ID'; errEl.style.display = 'block'; }
    return;
  }

  let student = null;

  try {
    const res  = await fetch(`${API_BASE}/admin-search.php?ypc_id=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (data.success && data.student) student = data.student;
    else throw new Error(data.error || 'Not found');
  } catch (_) {
    // Offline fallback — match against mock student
    const mock = {
      ypc_id: '23BIS12345', ljmu_id: 'LJMU-23-456789',
      name: 'Maxwell Ng Yi Ken', email: 'maxwell@student.ypc.edu.my',
      programme: 'Diploma in Business Information Systems',
      semester: 4, cgpa: 3.65, phone: '+60 12-345 6789',
      ic_number: '050312-14-XXXX', status: 'active',
    };
    if (query === mock.ypc_id || query.toLowerCase() === mock.ypc_id.toLowerCase()) {
      student = mock;
    } else {
      if (errEl) { errEl.textContent = `No student found for ID: ${query}`; errEl.style.display = 'block'; }
      const resultDiv = document.getElementById('adminStudentResult');
      if (resultDiv) resultDiv.style.display = 'none';
      return;
    }
  }

  populateAdminStudentForm(student);
}

function populateAdminStudentForm(student) {
  const set    = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setText('adminStuName',  student.name);
  setText('adminStuYpcId', student.ypc_id);
  setText('adminStuProg',  student.programme || '—');
  const av = document.getElementById('adminStuAvatar');
  if (av) av.textContent = (student.name || 'S').charAt(0).toUpperCase();

  set('adminEditYpcId',  student.ypc_id   || '');
  set('adminEditLjmuId', student.ljmu_id  || '');
  set('adminEditName',   student.name     || '');
  set('adminEditEmail',  student.email    || '');
  set('adminEditProg',   student.programme|| '');
  set('adminEditSem',    student.semester || '');
  set('adminEditCgpa',   student.cgpa     || '');

  const statusEl = document.getElementById('adminEditStatus');
  if (statusEl) statusEl.value = student.status || 'active';

  const succ = document.getElementById('adminSaveSuccess');
  if (succ) succ.style.display = 'none';

  const resultDiv = document.getElementById('adminStudentResult');
  if (resultDiv) resultDiv.style.display = 'block';
}

async function adminSaveStudent() {
  const get = id => document.getElementById(id)?.value?.trim() || '';

  const payload = {
    original_ypc_id: document.getElementById('adminSearchInput')?.value?.trim() || '',
    ypc_id:    get('adminEditYpcId'),
    ljmu_id:   get('adminEditLjmuId'),
    name:      get('adminEditName'),
    email:     get('adminEditEmail'),
    programme: get('adminEditProg'),
    semester:  parseInt(get('adminEditSem')) || 1,
    cgpa:      parseFloat(get('adminEditCgpa')) || 0,
    status:    get('adminEditStatus'),
    admin_username: currentAdmin?.username || 'admin',
  };

  try {
    const res  = await fetch(`${API_BASE}/admin-update-student.php`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Save failed');
  } catch (_) {
    // Offline — update succeeds silently
  }

  // Update displayed header
  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setText('adminStuName',  payload.name);
  setText('adminStuYpcId', payload.ypc_id);
  setText('adminStuProg',  payload.programme);
  const av = document.getElementById('adminStuAvatar');
  if (av) av.textContent = (payload.name || 'S').charAt(0).toUpperCase();

  const succ = document.getElementById('adminSaveSuccess');
  if (succ) { succ.style.display = 'block'; setTimeout(() => { succ.style.display = 'none'; }, 2500); }
}


/* ================================================
   DASHBOARD
   ================================================ */

function loadDashboard() {
  if (!currentStudent) return;
  const { name = '', ypc_id = '', programme = '', semester = '', cgpa = '' } = currentStudent;

  const hour  = new Date().getHours();
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const set   = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  const subEl = document.getElementById('dashGreetSub');
  if (subEl) subEl.textContent = greet;

  const nameEl = document.getElementById('dashGreetName');
  if (nameEl) {
    const parts = name.split(' ');
    nameEl.innerHTML = parts.slice(0, 2).join('<br>') + ' 👋';
  }

  set('dashName',  name);
  set('dashYpcId', `ID: ${ypc_id}`);
  set('dashProg',  programme);
  set('dashCgpa',  cgpa);
  set('dashSem',   `Sem ${semester}`);

  const av = document.getElementById('dashAvatar');
  if (av) av.textContent = name.charAt(0).toUpperCase();
}


/* ================================================
   PROFILE
   ================================================ */

function loadProfile() {
  if (!currentStudent) return;
  const {
    name = '', ypc_id = '', ljmu_id = '', programme = '',
    semester = '', cgpa = '', email = '', phone = '',
    ic_number = '', intake_date = '', status = 'active',
  } = currentStudent;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('profileName',   name);
  set('profileYpcId',  ypc_id);
  set('profileLjmuId', ljmu_id || '—');
  set('profileSem',    `${semester} of 6`);
  set('profileProg',   programme);
  set('profileCgpa',   cgpa);
  set('profileEmail',  email);
  set('profilePhone',  phone);
  set('profileIc',     ic_number);

  const av = document.getElementById('profileAvatar');
  if (av) av.textContent = name.charAt(0).toUpperCase();

  const intakeEl = document.getElementById('profileIntake');
  if (intakeEl && intake_date) {
    const d   = new Date(intake_date);
    const mon = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    intakeEl.textContent = `Intake: ${mon} · Jan–Apr 2026`;
  }

  const chipEl = document.getElementById('profileStatusChip');
  if (chipEl) {
    chipEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    chipEl.className   = `chip ${status === 'active' ? 'chip-green' : status === 'suspended' ? 'chip-red' : 'chip-blue'}`;
  }

  // Prefill edit modal
  const ep = document.getElementById('editPhone');
  const ei = document.getElementById('editIc');
  const ee = document.getElementById('editEmailDisplay');
  if (ep) ep.value = phone;
  if (ei) ei.value = ic_number;
  if (ee) ee.textContent = email;

  loadPaymentSummaryForProfile();
}

async function loadPaymentSummaryForProfile() {
  const data        = await apiGet('payments.php');
  const outstanding = data ? parseFloat(data.outstanding_amount) || 0 : 0;
  const statusEl    = document.getElementById('profileAcctStatus');
  const chipEl      = document.getElementById('profileAcctChip');
  if (statusEl) statusEl.textContent = outstanding > 0 ? `RM ${outstanding.toFixed(2)} outstanding` : 'All fees settled';
  if (chipEl) {
    chipEl.textContent = outstanding > 0 ? 'Outstanding' : 'Paid';
    chipEl.className   = `chip ${outstanding > 0 ? 'chip-red' : 'chip-green'}`;
  }
}


/* ================================================
   EDIT PERSONAL INFO
   ================================================ */

function openEditModal() {
  const modal = document.getElementById('editModal');
  if (!modal) return;
  // Prefill from current student data
  const ep = document.getElementById('editPhone');
  const ei = document.getElementById('editIc');
  if (ep) ep.value = currentStudent?.phone || '';
  if (ei) ei.value = currentStudent?.ic_number || '';
  const succ = document.getElementById('editSuccess');
  if (succ) succ.style.display = 'none';
  modal.style.display = 'flex';
}

function closeEditModal() {
  const modal = document.getElementById('editModal');
  if (modal) modal.style.display = 'none';
}

async function savePersonalInfo() {
  const phone = document.getElementById('editPhone')?.value?.trim() || '';
  const ic    = document.getElementById('editIc')?.value?.trim()    || '';

  // Update local state
  if (currentStudent) {
    currentStudent.phone      = phone;
    currentStudent.ic_number  = ic;
    sessionStorage.setItem('ypc_student', JSON.stringify(currentStudent));
  }

  // Update profile display
  const phoneEl = document.getElementById('profilePhone');
  const icEl    = document.getElementById('profileIc');
  if (phoneEl) phoneEl.textContent = phone;
  if (icEl)    icEl.textContent    = ic;

  // Optional: POST to API
  try {
    await fetch(`${API_BASE}/update-student.php`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ypc_id: currentStudent?.ypc_id, phone, ic_number: ic }),
    });
  } catch (_) { /* offline — local update only */ }

  // Show success
  const succ = document.getElementById('editSuccess');
  if (succ) succ.style.display = 'block';
  setTimeout(closeEditModal, 1400);
}


/* ================================================
   ATTENDANCE
   ================================================ */

async function loadAttendance() {
  const data = await apiGet('attendance.php');
  if (!data) return;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('attendPct',      `${data.overall}%`);
  set('attendTotal',    data.total);
  set('attendAttended', data.attended);
  set('attendAbsent',   data.absent);

  const ring = document.getElementById('attendRing');
  if (ring) {
    const offset = 238.76 - (data.overall / 100) * 238.76;
    ring.setAttribute('stroke-dashoffset', offset.toFixed(2));
  }

  const container = document.getElementById('subjectAttend');
  if (container && data.subjects?.length) {
    container.innerHTML = data.subjects.map(s => {
      const pct     = s.total > 0 ? Math.round((s.attended / s.total) * 100) : 0;
      const color   = pct >= 85 ? 'var(--green)' : pct >= 80 ? 'var(--gold)' : 'var(--red)';
      const gStart  = pct >= 85 ? '#059669' : pct >= 80 ? '#b45309' : '#9f1239';
      const gEnd    = pct >= 85 ? '#06d6a0' : pct >= 80 ? '#f4a100' : '#ef476f';
      const chipCls = pct >= 85 ? 'chip-green' : pct >= 80 ? 'chip-yellow' : 'chip-red';
      const chipTxt = pct >= 85 ? 'Safe' : pct >= 80 ? 'Watch' : 'At Risk';
      return `<div class="sa-card">
        <div class="sa-top"><span class="sa-subj">${s.subject}</span><span class="sa-pct" style="color:${color}">${pct}%</span></div>
        <div class="sa-bar"><div class="sa-fill" style="width:${pct}%;background:linear-gradient(90deg,${gStart},${gEnd})"></div></div>
        <div class="sa-foot"><span>${s.attended}/${s.total} classes</span><span class="chip ${chipCls}">${chipTxt}</span></div>
      </div>`;
    }).join('');
  }
}


/* ================================================
   RESULTS
   ================================================ */

async function loadResults() {
  const data = await apiGet('results.php');
  if (!data) return;

  const cgpaEl = document.getElementById('resultsCgpa');
  if (cgpaEl) cgpaEl.textContent = data.cgpa;

  const list = document.getElementById('resultList');
  if (list && data.results?.length) {
    list.innerHTML = data.results.map(r => {
      const color = r.score >= 80 ? '#06d6a0' : r.score >= 70 ? '#f4a100' : '#0693e3';
      const bg    = r.score >= 80 ? 'rgba(6,214,160,.15)' : r.score >= 70 ? 'rgba(244,161,0,.15)' : 'rgba(6,147,227,.15)';
      return `<div class="res-card">
        <div class="grade-badge" style="background:${bg};color:${color}">${r.grade}</div>
        <div class="res-info"><div class="res-subj">${r.subject}</div><div class="res-code">${r.code}</div></div>
        <div class="res-score"><div class="score" style="color:${color}">${r.score}</div><div class="credits">${r.credits} Credits</div></div>
      </div>`;
    }).join('');
  }
}


/* ================================================
   SCHEDULE
   ================================================ */

let scheduleData = null;

async function loadSchedule() {
  const data = await apiGet('schedule.php');
  scheduleData = data?.schedule || getMockSchedule();

  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const todayName = dayNames[new Date().getDay()];
  const activeDay = scheduleData[todayName] ? todayName : 'Fri';

  document.querySelectorAll('.day-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.day === activeDay);
  });
  renderScheduleDay(activeDay);
}

function renderScheduleDay(day) {
  const container = document.getElementById('fullSchedule');
  if (!container) return;
  const classes = scheduleData?.[day] || [];

  if (!classes.length) {
    container.innerHTML = '<div class="no-class">No classes scheduled for this day</div>';
    return;
  }

  const colors = { Lecture: '#06d6a0', Lab: '#a855f7', Tutorial: '#f4a100' };
  const chips  = { Lecture: 'chip-green', Lab: 'chip-purple', Tutorial: 'chip-yellow' };

  container.innerHTML = classes.map(c => {
    const color = colors[c.type] || '#8892a4';
    const chip  = chips[c.type]  || 'chip-yellow';
    return `<div class="fs-card">
      <div class="fs-time-col">
        <div class="fst">${c.time_start.slice(0,5)}</div>
        <div class="fst">${c.time_end.slice(0,5)}</div>
      </div>
      <div class="fs-line" style="background:linear-gradient(to bottom,${color},transparent)"></div>
      <div class="fs-body">
        <div class="fs-subj">${c.subject}</div>
        <div class="fs-lec">${c.lecturer}</div>
        <div class="fs-room">${c.room}</div>
      </div>
      <div class="fs-type chip ${chip}">${c.type}</div>
    </div>`;
  }).join('');
}

function getMockSchedule() {
  return {
    Mon: [
      { subject: 'Introduction to Programming', code: 'BIS2101', time_start: '08:00:00', time_end: '10:00:00', room: 'IT Block, Lab 1',    lecturer: 'Mr. Razif',         type: 'Lab' },
      { subject: 'Principles of Marketing',     code: 'BIS2401', time_start: '14:00:00', time_end: '16:00:00', room: 'Block B, Room 110',  lecturer: 'Dr. Halim',          type: 'Lecture' },
    ],
    Wed: [
      { subject: 'Database Systems',     code: 'BIS2204', time_start: '10:00:00', time_end: '12:00:00', room: 'Block A, Room 201', lecturer: 'Ms. Nurul Ain',     type: 'Lecture' },
      { subject: 'Business Mathematics', code: 'BIS2301', time_start: '14:00:00', time_end: '16:00:00', room: 'Block A, Room 203', lecturer: 'Dr. Ahmad Fadzli',  type: 'Tutorial' },
    ],
    Fri: [
      { subject: 'Business Mathematics',  code: 'BIS2301', time_start: '08:00:00', time_end: '10:00:00', room: 'Block A, Room 203', lecturer: 'Dr. Ahmad Fadzli', type: 'Lecture' },
      { subject: 'Database Systems',      code: 'BIS2204', time_start: '10:00:00', time_end: '12:00:00', room: 'IT Block, Lab 2',   lecturer: 'Ms. Nurul Ain',    type: 'Lab' },
      { subject: 'Communication Skills',  code: 'MPU2313', time_start: '14:00:00', time_end: '16:00:00', room: 'Block C, Room 105', lecturer: 'Pn. Siti Hajar',   type: 'Tutorial' },
    ],
  };
}


/* ================================================
   EXAM SLIPS + QR CODE
   ================================================ */

async function loadExamSlips() {
  const container = document.getElementById('examSlipList');
  if (!container) return;
  container.innerHTML = '<div class="slip-loading">Loading exam slips…</div>';

  const data  = await apiGet('exam-slips.php');
  const slips = data?.exam_slips?.length ? data.exam_slips : getMockExamSlips();

  if (!slips.length) {
    container.innerHTML = '<div class="slip-loading">No exam slips found for this semester.</div>';
    return;
  }

  container.innerHTML = slips.map((slip, idx) => {
    const examDate  = new Date(slip.exam_date + 'T00:00:00');
    const dateStr   = examDate.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'long', year:'numeric' });
    const timeStr   = slip.exam_time.slice(0, 5);
    const isPM      = parseInt(timeStr) >= 12;
    const isScanned = !!slip.scanned_at;

    return `<div class="slip-card">
      <div class="slip-card-header">
        <div>
          <div class="slip-subject">${slip.subject}</div>
          <div class="slip-code">${slip.code} · ${slip.semester}</div>
        </div>
        ${isScanned ? '<span class="chip chip-green">Attended</span>' : '<span class="chip chip-yellow">Pending</span>'}
      </div>
      <div class="slip-meta">
        <div class="slip-meta-row">📅 <span>${dateStr}</span></div>
        <div class="slip-meta-row">🕐 <span><strong>${timeStr} ${isPM ? 'PM' : 'AM'}</strong></span></div>
        <div class="slip-meta-row">📍 <span>${slip.hall}</span></div>
        <div class="slip-meta-row">💺 Seat: <strong>${slip.seat_number}</strong></div>
      </div>
      <div class="qr-wrapper"><div id="qr-${idx}"></div></div>
      <div class="qr-id-strip">
        <div class="qr-id-row"><span class="qr-id-label">YPC ID</span><span class="qr-id-value">${slip.ypc_id}</span></div>
        <div class="qr-id-row"><span class="qr-id-label">LJMU ID</span><span class="qr-id-value">${slip.ljmu_id || '—'}</span></div>
        <div class="qr-id-row"><span class="qr-id-label">Name</span><span class="qr-id-value">${slip.student_name}</span></div>
      </div>
      <div class="qr-instructions">Show this QR code to your lecturer before entering the exam hall.</div>
      ${isScanned ? `<div class="slip-scanned">✅ Verified by ${slip.scanned_by || 'Lecturer'} · ${new Date(slip.scanned_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>` : ''}
    </div>`;
  }).join('');

  // Generate QR codes
  slips.forEach((slip, idx) => {
    const el = document.getElementById(`qr-${idx}`);
    if (!el) return;
    const payload = JSON.stringify({
      type: 'YPC_EXAM_SLIP', ypc_id: slip.ypc_id, ljmu_id: slip.ljmu_id || '',
      name: slip.student_name, subject: slip.subject, code: slip.code,
      date: slip.exam_date, time: slip.exam_time.slice(0,5),
      hall: slip.hall, seat: slip.seat_number, token: slip.qr_token,
    });
    if (typeof QRCode !== 'undefined') {
      new QRCode(el, { text: payload, width: 200, height: 200, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.M });
    } else {
      el.style.cssText = 'padding:16px;color:#000;font-size:9px;font-family:monospace;word-break:break-all;max-width:200px;text-align:center';
      el.textContent = slip.qr_token;
    }
  });
}

function getMockExamSlips() {
  const s = currentStudent || {};
  const base = { ypc_id: s.ypc_id || '23BIS12345', ljmu_id: s.ljmu_id || 'LJMU-23-456789', student_name: s.name || 'Maxwell Ng Yi Ken', semester: 'Jan-Apr 2026', scanned_at: null, scanned_by: null };
  return [
    { ...base, id:1, subject:'Database Systems',            code:'BIS2204', exam_date:'2026-05-12', exam_time:'09:00:00', hall:'Exam Hall A', seat_number:'A12', qr_token:'ES-BIS2204-23BIS12345-0512' },
    { ...base, id:2, subject:'Introduction to Programming', code:'BIS2101', exam_date:'2026-05-14', exam_time:'09:00:00', hall:'Exam Hall A', seat_number:'A14', qr_token:'ES-BIS2101-23BIS12345-0514' },
    { ...base, id:3, subject:'Business Mathematics',        code:'BIS2301', exam_date:'2026-05-16', exam_time:'14:00:00', hall:'Exam Hall B', seat_number:'B07', qr_token:'ES-BIS2301-23BIS12345-0516' },
    { ...base, id:4, subject:'Principles of Marketing',     code:'BIS2401', exam_date:'2026-05-19', exam_time:'09:00:00', hall:'Exam Hall A', seat_number:'A12', qr_token:'ES-BIS2401-23BIS12345-0519' },
    { ...base, id:5, subject:'Communication Skills',        code:'MPU2313', exam_date:'2026-05-21', exam_time:'14:00:00', hall:'Exam Hall B', seat_number:'B03', qr_token:'ES-MPU2313-23BIS12345-0521' },
  ];
}


/* ================================================
   PAYMENTS
   ================================================ */

async function loadPayments() {
  const data      = await apiGet('payments.php');
  const payments  = data?.payments    || getMockPayments();
  const outstanding = data ? parseFloat(data.outstanding_amount) || 0 : 0;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const amountEl = document.getElementById('poAmount');
  if (amountEl) {
    amountEl.textContent = `RM ${outstanding.toFixed(2)}`;
    amountEl.className   = `po-amount ${outstanding > 0 ? 'bad' : 'good'}`;
  }
  const chipEl = document.getElementById('poChip');
  if (chipEl) { chipEl.textContent = outstanding > 0 ? 'Outstanding' : 'All Settled'; chipEl.className = `chip ${outstanding > 0 ? 'chip-red' : 'chip-green'}`; }
  const labelEl = document.getElementById('poLabel');
  if (labelEl) labelEl.textContent = outstanding > 0 ? 'Outstanding Balance' : 'Account Balance';

  const list = document.getElementById('paymentList');
  if (!list) return;
  const icons = { tuition:'🎓', registration:'📋', exam:'📝', hostel:'🏠', other:'💳' };

  list.innerHTML = payments.map(p => {
    const icon    = icons[p.type] || '💳';
    const isPaid  = p.status === 'paid';
    const dateStr = (isPaid && p.paid_date ? new Date(p.paid_date) : p.due_date ? new Date(p.due_date) : null)
      ?.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) || '—';
    const chipCls = p.status === 'paid' ? 'chip-green' : p.status === 'overdue' ? 'chip-red' : 'chip-yellow';
    const chipTxt = p.status === 'paid' ? 'Paid' : p.status === 'overdue' ? 'Overdue' : 'Pending';
    return `<div class="pay-card">
      <div class="pay-icon">${icon}</div>
      <div class="pay-info"><div class="pay-desc">${p.description}</div><div class="pay-date">${isPaid ? 'Paid: ' : 'Due: '}${dateStr}</div></div>
      <div class="pay-right">
        <div class="pay-amount">RM ${parseFloat(p.amount).toFixed(2)}</div>
        <span class="chip ${chipCls}">${chipTxt}</span>
        ${p.reference ? `<div class="pay-ref">${p.reference}</div>` : ''}
      </div>
    </div>`;
  }).join('');
}

function getMockPayments() {
  return [
    { description:'Tuition Fee – Semester 4',      amount:3500.00, due_date:'2026-01-10', paid_date:'2026-01-08', status:'paid', type:'tuition',      reference:'PAY2026-001' },
    { description:'Registration Fee – Semester 4', amount: 150.00, due_date:'2026-01-10', paid_date:'2026-01-08', status:'paid', type:'registration', reference:'PAY2026-002' },
    { description:'Exam Fee – Jan–Apr 2026',        amount: 200.00, due_date:'2026-04-01', paid_date:'2026-03-20', status:'paid', type:'exam',         reference:'PAY2026-003' },
    { description:'Tuition Fee – Semester 3',      amount:3500.00, due_date:'2025-07-10', paid_date:'2025-07-05', status:'paid', type:'tuition',      reference:'PAY2025-004' },
    { description:'Registration Fee – Semester 3', amount: 150.00, due_date:'2025-07-10', paid_date:'2025-07-05', status:'paid', type:'registration', reference:'PAY2025-005' },
  ];
}


/* ================================================
   EXTRACURRICULAR
   ================================================ */

async function loadExtracurricular() {
  // Data is currently static HTML — future: fetch from API
  // Animate stat counters
  animateCounter('extraCount',   3);
  animateCounter('leaderCount',  2);
  animateCounter('awardCount',   1);
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  let current = 0;
  const step  = Math.ceil(target / 20);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 40);
}


/* ================================================
   DOCUMENT CHECKLIST
   ================================================ */

async function loadDocuments() {
  // Animate progress bar
  const bar = document.getElementById('docProgressBar');
  if (bar) {
    bar.style.width = '0%';
    setTimeout(() => { bar.style.width = '78%'; }, 100);
  }
}


/* ================================================
   DISCIPLINARY RECORD
   ================================================ */

async function loadDisciplinary() {
  // Data is static (clean record) — future: fetch from API
  // Could fetch and show real records if they exist
}


/* ================================================
   DEFERRED SESSION RESTORE
   (runs after all functions are defined)
   ================================================ */

(function applySession() {
  if (currentAdmin) {
    goTo('admin-dashboard');
  } else if (currentStudent) {
    goTo('dashboard');
  }
}());
