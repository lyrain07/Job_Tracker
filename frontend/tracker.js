const API = 'http://127.0.0.1:8000';
const user = JSON.parse(localStorage.getItem('user'));
if (!user) window.location.href = 'login.html';

let applications = [];
let editMode = false;

async function loadTracker() {
    const tbody = document.getElementById('trackerBody');
    try {
        const res = await fetch(`${API}/api/applications/${user.user_id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        applications = await res.json();

        if (applications.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No applications yet. Go to <a href="jobs.html" style="color:#6366F1;">Jobs</a> to start applying!</td></tr>';
            return;
        }

        renderTable();
    } catch (err) {
        console.error('Tracker load error:', err);
        tbody.innerHTML = `<tr><td colspan="7" class="table-empty" style="color:#F87171;">Failed to load applications. Is the backend running at ${API}?</td></tr>`;
    }
}

function renderTable() {
    const tbody = document.getElementById('trackerBody');

    tbody.innerHTML = applications.map((app, i) => `
        <tr style="cursor:pointer;" onclick="openDetailModal(${i})">
            <td><strong>${app.company}</strong></td>
            <td>${app.title}</td>
            <td><span class="meta-tag" style="background:#ecfdf5; color:#065f46; font-weight:600;">${app.salary || 'N/A'}</span></td>
            <td>${new Date(app.date).toLocaleDateString()}</td>
            <td><span class="status-badge status-${app.status}">${app.status}</span></td>
            <td><span style="font-size:0.85rem; font-weight:600; color:#6366f1;">${app.interview_round && app.interview_round > 0 ? 'Round ' + app.interview_round : 'None'}</span></td>
            <td class="edit-col" style="display:${editMode ? 'table-cell' : 'none'};">
                <button onclick="event.stopPropagation(); deleteApplication(${app.application_id})"
                    style="background:none; border:1px solid #fecaca; color:#dc2626; padding:4px 12px; border-radius:8px; cursor:pointer; font-size:0.8rem; font-weight:600;">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function toggleEditMode() {
    editMode = !editMode;
    const btn = document.getElementById('editTrackerBtn');
    const editCols = document.querySelectorAll('.edit-col');

    if (editMode) {
        btn.innerHTML = '<i class="fas fa-times" style="margin-right:8px;"></i>Done';
        editCols.forEach(col => col.style.display = 'table-cell');
    } else {
        btn.innerHTML = '<i class="fas fa-edit" style="margin-right:8px;"></i>Edit Tracker';
        editCols.forEach(col => col.style.display = 'none');
    }
}

async function deleteApplication(applicationId) {
    if (!confirm('Delete this application from your tracker?')) return;

    try {
        const res = await fetch(`${API}/api/applications/${applicationId}`, { method: 'DELETE' });
        if (res.ok) {
            applications = applications.filter(a => a.application_id !== applicationId);
            if (applications.length === 0) {
                document.getElementById('trackerBody').innerHTML =
                    '<tr><td colspan="7" class="table-empty">No applications yet. Go to <a href="jobs.html" style="color:#6366F1;">Jobs</a> to start applying!</td></tr>';
            } else {
                renderTable();
            }
        } else {
            const err = await res.json();
            alert(err.detail || 'Failed to delete application.');
        }
    } catch {
        alert('Connection error. Please try again.');
    }
}

function openDetailModal(index) {
    const app = applications[index];
    if (!app) return;

    document.getElementById('detailTitle').textContent = app.title;
    document.getElementById('detailCompany').textContent = app.company;

    document.getElementById('detailMeta').innerHTML = `
        <span class="meta-tag">💼 ${app.type || 'N/A'}</span>
        <span class="meta-tag">💰 ${app.salary || 'N/A'}</span>
        <span class="meta-tag">📅 Applied: ${new Date(app.date).toLocaleDateString()}</span>
        <span class="meta-tag"><span class="status-badge status-${app.status}">${app.status}</span></span>
        ${app.interview_round && app.interview_round > 0 ? `<span class="meta-tag">🎯 Interview Round: ${app.interview_round}</span>` : ''}
        ${app.interview_mode ? `<span class="meta-tag">📞 Mode: ${app.interview_mode}</span>` : ''}
        ${app.interview_date ? `<span class="meta-tag">🗓 Date: ${new Date(app.interview_date).toLocaleDateString()}</span>` : ''}
        ${app.interview_result ? `<span class="meta-tag">✅ Result: ${app.interview_result}</span>` : ''}
    `;

    document.getElementById('detailNotes').textContent = app.notes || 'No notes added for this application.';
    document.getElementById('detailModal').classList.add('active');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
}

loadTracker();
