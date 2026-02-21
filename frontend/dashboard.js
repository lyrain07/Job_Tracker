const API = 'http://127.0.0.1:8000';

// Get the logged-in user; redirect if not authenticated
const user = JSON.parse(localStorage.getItem('user'));
if (!user) window.location.href = 'login.html';

// Display first name in the greeting
if (document.getElementById('userGreeting')) {
    document.getElementById('userGreeting').textContent = user.name.split(' ')[0];
}

// ─── Stats ────────────────────────────────────────────────────

async function loadStats() {
    try {
        const res = await fetch(`${API}/api/dashboard/${user.user_id}`);
        const data = await res.json();

        if (res.ok) {
            document.getElementById('total').textContent = data.total_applications;
            document.getElementById('interviewing').textContent = data.interviewing_count;
            document.getElementById('rejected').textContent = data.rejected_count;
            document.getElementById('hired').textContent = data.hired_count;
        }
    } catch {
        console.error('Dashboard stats could not be loaded.');
    }
}

async function loadRecentApplications() {
    const tbody = document.getElementById('applicationsTable');

    try {
        const res = await fetch(`${API}/api/applications/${user.user_id}`);
        const apps = await res.json();

        if (!res.ok || apps.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No applications yet. Start applying!</td></tr>';
            return;
        }

        // Show only the 5 most recent applications on the dashboard
        const recentApps = apps.slice(0, 5);
        tbody.innerHTML = recentApps.map(app => `
            <tr>
                <td><strong>${app.company}</strong></td>
                <td>${app.title}</td>
                <td><span class="meta-tag" style="background: #ecfdf5; color: #065f46; font-weight: 600;">${app.salary || 'N/A'}</span></td>
                <td>${new Date(app.date).toLocaleDateString()}</td>
                <td><span class="status-badge status-${app.status}">${app.status}</span></td>
                <td><span style="font-size: 0.85rem; font-weight: 600; color: #6366f1;">${app.interview_round && app.interview_round > 0 ? 'Round ' + app.interview_round : 'None'}</span></td>
            </tr>
        `).join('');
    } catch {
        tbody.innerHTML = '<tr><td colspan="6" class="table-empty">Could not load applications.</td></tr>';
    }
}

loadStats();
loadRecentApplications();