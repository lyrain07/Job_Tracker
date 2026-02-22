const API = 'https://job-tracker-8e22.onrender.com';
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
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--lt-text-muted); font-size: 0.85rem;">
                ${app.notes || '-'}
            </td>
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

let currentAppId = null;

function toggleRoundInput() {
    const status = document.getElementById('updateStatus').value;
    const roundGroup = document.getElementById('roundInputGroup');
    roundGroup.style.display = (status === 'Interviewing') ? 'block' : 'none';
}

function openDetailModal(index) {
    const app = applications[index];
    if (!app) return;

    currentAppId = app.application_id;
    document.getElementById('detailTitle').textContent = app.title;
    document.getElementById('detailCompany').textContent = app.company;

    // Populate Status and Round
    document.getElementById('updateStatus').value = app.status;
    if (app.interview_round) {
        document.getElementById('updateRound').value = app.interview_round;
    }
    toggleRoundInput();

    document.getElementById('detailMeta').innerHTML = `
        <span class="meta-tag">${app.type || 'N/A'}</span>
        <span class="meta-tag">${app.salary || 'N/A'}</span>
        <span class="meta-tag">Applied: ${new Date(app.date).toLocaleDateString()}</span>
        <span class="meta-tag"><span class="status-badge status-${app.status}">${app.status}</span></span>
        ${app.interview_round && app.interview_round > 0 ? `<span class="meta-tag">Interview Round: ${app.interview_round}</span>` : ''}
    `;

    document.getElementById('displayNotes').textContent = app.notes || 'No notes added for this application.';
    document.getElementById('detailNotes').value = app.notes || '';
    document.getElementById('detailModal').classList.add('active');
}

async function saveApplicationDetails() {
    if (!currentAppId) return;

    const status = document.getElementById('updateStatus').value;
    const round = status === 'Interviewing' ? parseInt(document.getElementById('updateRound').value) : null;
    const notes = document.getElementById('detailNotes').value;

    const btn = document.getElementById('saveTrackerBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API}/api/applications/${currentAppId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: status,
                notes: notes === 'No notes added for this application.' ? '' : notes,
                interview_round: round
            })
        });

        if (res.ok) {
            closeDetailModal();
            loadTracker(); // Refresh table
        } else {
            const err = await res.json();
            alert(err.detail || 'Failed to update application.');
        }
    } catch (err) {
        console.error('Save error:', err);
        alert('Connection error. Please try again.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
}

loadTracker();
