const API = '/api/demos';
let demos = [];

const el = (id) => document.getElementById(id);
const statusIndicator = el('statusIndicator');

function setStatus(text, isError = false) {
  statusIndicator.textContent = text;
  statusIndicator.classList.toggle('error', isError);
}

async function loadDemos() {
  setStatus('Loading…');
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
    const data = await res.json();
    demos = data.demos;
    setStatus(`Synced · ${demos.length} demos`);
    populateStateFilters();
    renderDashboard();
    renderTable();
  } catch (err) {
    console.error(err);
    setStatus('Error loading demos — check server/.env setup', true);
  }
}

// Fill the State dropdowns (All demos + Dashboard) with the unique states
// actually present in the data, so the list stays in sync automatically.
function populateStateFilters() {
  const states = Array.from(new Set(demos.map((d) => (d.state || '').trim()).filter(Boolean))).sort();
  for (const selectId of ['filterState', 'dashFilterState']) {
    const select = el(selectId);
    const current = select.value;
    select.innerHTML = '<option value="">All</option>' + states.map((s) => `<option>${s}</option>`).join('');
    if (states.includes(current)) select.value = current;
  }
}

function renderDashboard() {
  const state = el('dashFilterState').value;
  const from = el('dashFilterFrom').value;
  const to = el('dashFilterTo').value;

  const filtered = demos.filter((d) => {
    if (state && d.state !== state) return false;
    if (from && (!d.date || d.date < from)) return false;
    if (to && (!d.date || d.date > to)) return false;
    return true;
  });

  const counts = { total: filtered.length };
  for (const s of ['Scheduled', 'Demo Completed', 'Follow-up', 'Confirmed', 'Rescheduled', 'Lost']) {
    counts[s] = filtered.filter((d) => d.status === s).length;
  }
  const cards = [
    ['Total demos', counts.total],
    ['Scheduled', counts['Scheduled']],
    ['Completed', counts['Demo Completed']],
    ['Follow-up', counts['Follow-up']],
    ['Confirmed', counts['Confirmed']],
    ['Rescheduled', counts['Rescheduled']],
    ['Lost', counts['Lost']],
  ];
  el('dashboardCards').innerHTML = cards
    .map(([label, num]) => `<div class="card"><div class="num">${num}</div><div class="label">${label}</div></div>`)
    .join('');
}

['dashFilterState', 'dashFilterFrom', 'dashFilterTo'].forEach((id) => {
  el(id).addEventListener('input', renderDashboard);
  el(id).addEventListener('change', renderDashboard);
});

el('dashFilterClear').addEventListener('click', () => {
  el('dashFilterState').value = '';
  el('dashFilterFrom').value = '';
  el('dashFilterTo').value = '';
  renderDashboard();
});

function leadBadgeClass(quality) {
  if (quality === 'Hot') return 'badge-hot';
  if (quality === 'Warm') return 'badge-warm';
  return 'badge-cold';
}

function renderTable() {
  const status = el('filterStatus').value;
  const lead = el('filterLead').value;
  const state = el('filterState').value;
  const q = el('searchBox').value.trim().toLowerCase();

  const filtered = demos.filter((d) => {
    if (status && d.status !== status) return false;
    if (lead && d.leadQuality !== lead) return false;
    if (state && d.state !== state) return false;
    if (q) {
      const hay = `${d.school || ''} ${d.contactName || ''} ${d.city || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  el('demoRows').innerHTML = filtered
    .map((d) => {
      const isRescheduled = d.status === 'Rescheduled' && (d.rescheduledDate || d.rescheduledTime);
      const dateCell = isRescheduled
        ? `<span style="color:#888;text-decoration:line-through">${d.date || '—'}</span><br><strong>${d.rescheduledDate || '—'}</strong>${d.rescheduledTime ? ' <span style="color:#888">' + d.rescheduledTime + '</span>' : ''}`
        : `${d.date || '—'}${d.time ? '<br><span style="color:#888">' + d.time + '</span>' : ''}`;
      return `
      <tr>
        <td>${dateCell}</td>
        <td><strong>${d.school || '—'}</strong>${d.city ? '<br><span style="color:#888">' + d.city + (d.state ? ', ' + d.state : '') + '</span>' : ''}</td>
        <td>${d.contactName || '—'}${d.contactEmail ? '<br><span style="color:#888">' + d.contactEmail + '</span>' : ''}</td>
        <td>${d.demoBy || '—'}</td>
        <td>${d.salesLead || '—'}</td>
        <td>${d.status ? `<span class="badge badge-status">${d.status}</span>` : '—'}</td>
        <td>${d.leadQuality ? `<span class="badge ${leadBadgeClass(d.leadQuality)}">${d.leadQuality}</span>` : '—'}</td>
        <td class="actions-cell">
          <button class="btn-view" data-id="${d.id}">View</button>
          <button class="btn-edit" data-id="${d.id}">Edit</button>
          <button class="btn-delete" data-id="${d.id}">Delete</button>
        </td>
      </tr>
    `;
    })
    .join('') || '<tr><td colspan="8" style="text-align:center;color:#888;padding:24px;">No demos match these filters.</td></tr>';

  document.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => openModal(demos.find((d) => d.id === btn.dataset.id)));
  });
  document.querySelectorAll('.btn-view').forEach((btn) => {
    btn.addEventListener('click', () => openViewModal(demos.find((d) => d.id === btn.dataset.id)));
  });
  document.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => deleteDemo(btn.dataset.id));
  });
}

async function deleteDemo(id) {
  const demo = demos.find((d) => d.id === id);
  const label = demo ? demo.school || 'this demo' : 'this demo';
  if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
  setStatus('Deleting…');
  try {
    const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error((await res.json()).error || 'Delete failed');
    await loadDemos();
  } catch (err) {
    console.error(err);
    setStatus('Delete failed — try again', true);
  }
}

// --- Tabs ---
document.querySelectorAll('.tab[data-tab]').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab[data-tab]').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    el(tab.dataset.tab).classList.add('active');
  });
});

// --- Filters ---
['filterStatus', 'filterLead', 'filterState', 'searchBox'].forEach((id) => {
  el(id).addEventListener('input', renderTable);
  el(id).addEventListener('change', renderTable);
});

// --- Modal ---
const FIELD_IDS = [
  'school', 'date', 'time', 'mode', 'city', 'state', 'address', 'board', 'management',
  'studentStrength', 'staffNumber', 'contactName', 'contactPhone', 'contactEmail', 'requirement',
  'demoBy', 'salesLead', 'meetingLink', 'leadQuality', 'status',
  'rescheduledDate', 'rescheduledTime', 'remarks',
];

const FIELD_LABELS = {
  school: 'School name', date: 'Date', time: 'Time', mode: 'Mode', city: 'City', state: 'State',
  address: 'Address', board: 'Board', management: 'Management', studentStrength: 'Student strength',
  staffNumber: 'Staff number', contactName: 'Contact name', contactPhone: 'Contact phone',
  contactEmail: 'Contact email', requirement: 'Requirement',
  demoBy: 'Demo taken by', salesLead: 'Sales lead', meetingLink: 'Meeting link',
  leadQuality: 'Lead quality', status: 'Status', rescheduledDate: 'Rescheduled date',
  rescheduledTime: 'Rescheduled time', remarks: 'Remarks',
};

function toggleRescheduleFields() {
  const isRescheduled = el('f_status').value === 'Rescheduled';
  el('rescheduleDateWrap').classList.toggle('hidden', !isRescheduled);
  el('rescheduleTimeWrap').classList.toggle('hidden', !isRescheduled);
}
el('f_status').addEventListener('change', toggleRescheduleFields);

function openModal(demo) {
  el('modalTitle').textContent = demo ? 'Edit demo' : 'Add demo';
  el('recordId').value = demo ? demo.id : '';
  FIELD_IDS.forEach((key) => {
    const input = el('f_' + key);
    input.value = demo ? (demo[key] ?? '') : '';
  });
  const yourName = el('yourName').value.trim();
  if (!demo && yourName && !el('f_salesLead').value) {
    el('f_salesLead').value = yourName;
  }
  toggleRescheduleFields();
  el('viewModalBackdrop').classList.remove('open');
  el('modalBackdrop').classList.add('open');
}

function closeModal() {
  el('modalBackdrop').classList.remove('open');
  el('demoForm').reset();
}

el('addDemoBtn').addEventListener('click', () => openModal(null));
el('cancelBtn').addEventListener('click', closeModal);
el('modalBackdrop').addEventListener('click', (e) => {
  if (e.target === el('modalBackdrop')) closeModal();
});

// --- View modal (read-only, full info) ---
function openViewModal(demo) {
  if (!demo) return;
  el('viewGrid').innerHTML = FIELD_IDS
    .map((key) => {
      const value = demo[key];
      if (value === undefined || value === null || value === '') return '';
      return `<div class="view-row"><div class="view-label">${FIELD_LABELS[key] || key}</div><div class="view-value">${value}</div></div>`;
    })
    .join('') || '<p style="color:#888">No details recorded.</p>';
  el('viewEditBtn').dataset.id = demo.id;
  el('modalBackdrop').classList.remove('open');
  el('viewModalBackdrop').classList.add('open');
}

el('viewCloseBtn').addEventListener('click', () => el('viewModalBackdrop').classList.remove('open'));
el('viewModalBackdrop').addEventListener('click', (e) => {
  if (e.target === el('viewModalBackdrop')) el('viewModalBackdrop').classList.remove('open');
});
el('viewEditBtn').addEventListener('click', () => {
  const demo = demos.find((d) => d.id === el('viewEditBtn').dataset.id);
  el('viewModalBackdrop').classList.remove('open');
  openModal(demo);
});

el('demoForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = el('recordId').value;
  const payload = {};
  FIELD_IDS.forEach((key) => {
    const val = el('f_' + key).value;
    if (val !== '') {
      payload[key] = (key === 'studentStrength' || key === 'staffNumber') ? Number(val) : val;
    }
  });

  setStatus('Saving…');
  try {
    const res = await fetch(id ? `${API}/${id}` : API, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
    closeModal();
    await loadDemos();
  } catch (err) {
    console.error(err);
    setStatus('Save failed — try again', true);
  }
});

loadDemos();
