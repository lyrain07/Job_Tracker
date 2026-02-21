const API = 'http://127.0.0.1:8000';
const user = JSON.parse(localStorage.getItem('user'));
if (!user) window.location.href = 'login.html';

let applications = [];
let isEditMode = false;

async function loadTracker() {
    try {
        const res = await fetch(`${API}/api/applications/${user.user_id}`);
        applications = await res.json();
        renderTracker();
    } catch {
        const body = document.getElementById('trackerBody');
        body.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px;">Failed to load data.</td></tr>';
    }
}

function renderTracker() {
    const body = document.getElementById('trackerBody');
    if (applications.length === 0) {
        body.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 40px;">No applications yet. Browse jobs to get started!</td></tr>';
        return;
    }

    body.innerHTML = applications.map(app => `
        <tr>
            <td><strong>${app.company}</strong></td>
            <td>
                <a href="#" class="job-title-link" onclick="showJobDetails(${app.application_id})">${app.title}</a>
            </td>
            <td><span class="meta-tag"><i class="fas fa-money-bill-wave" style="margin-right: 6px; color: #10b981;"></i>${app.salary || 'N/A'}</span></td>
            <td>${new Date(app.date).toLocaleDateString()}</td>
            <td><span class="status-badge status-${app.status}">${app.status}</span></td>
            <td>${renderInterviewBadge(app)}</td>
            <td class="edit-col" style="${isEditMode ? 'display: table-cell;' : 'display: none;'}">
                <button class="logout-btn" style="padding: 6px 12px; background: #fee2e2; color: #dc2626; border-color: #fecaca;" onclick="deleteApp(${app.application_id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderInterviewBadge(app) {
    if (!app.interview_round || app.interview_round === 0) return '<span class="status-badge" style="background: #f1f5f9; color: #64748b;">No Interview</span>';

    let color = '#6366f1'; // Default blue
    if (app.interview_result === 'Passed') color = '#10b981';
    if (app.interview_result === 'Failed') color = '#ef4444';

    return `
        <div class="interview-badge" style="border-left-color: ${color}">
            <div style="font-weight: 700; font-size: 0.8rem;">Round ${app.interview_round}</div>
            <div style="font-size: 0.7rem; opacity: 0.8;">${app.interview_mode || 'N/A'}</div>
        </div>
    `;
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    const btn = document.getElementById('editTrackerBtn');
    if (isEditMode) {
        btn.innerHTML = '<i class="fas fa-check" style="margin-right: 8px;"></i>Done Editing';
        btn.style.background = 'var(--primary)';
        btn.style.color = 'white';
    } else {
        btn.innerHTML = '<i class="fas fa-edit" style="margin-right: 8px;"></i>Edit Tracker';
        btn.style.background = '#f8fafc';
        btn.style.color = '#475569';
    }
    renderTracker();
}

async function deleteApp(id) {
    if (!confirm("Are you sure you want to remove this application from your tracker? This action cannot be undone.")) return;

    try {
        const res = await fetch(`${API}/api/applications/${id}`, { method: 'DELETE' });
        if (res.ok) {
            applications = applications.filter(a => a.application_id !== id);
            renderTracker();
        } else {
            alert("Failed to delete application.");
        }
    } catch {
        alert("Connection error.");
    }
}

function showJobDetails(appId) {
    const app = applications.find(a => a.application_id === appId);
    if (!app) return;

    document.getElementById('detailTitle').textContent = app.title || app.job_title;
    document.getElementById('detailCompany').textContent = `${app.company_name || app.company} · Applied on ${new Date(app.applied_date).toLocaleDateString()}`;

    document.getElementById('detailMeta').innerHTML = `
        <span class="meta-tag"><i class="fas fa-briefcase" style="margin-right: 8px;"></i>${app.job_type || 'Full-time'}</span>
        <span class="status-badge status-${app.status}" style="font-size: 0.9rem;">${app.status}</span>
    `;

    document.getElementById('detailDesc').textContent = app.description || "No description available for this tracked job.";
    document.getElementById('detailNotes').textContent = app.notes || "No notes added for this application.";

    document.getElementById('detailModal').classList.add('active');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
}

function unescape(str) {
    if (!str) return '';
    return str.replace(/\\'/g, "'");
}

loadTracker();
