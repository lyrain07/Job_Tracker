const API = 'http://127.0.0.1:8000';
const user = JSON.parse(localStorage.getItem('user'));
if (!user) window.location.href = 'login.html';

let allJobs = [];
let selectedJobId = null;

// Load Jobs
async function loadJobs() {
    try {
        const res = await fetch(`${API}/api/jobs`);
        allJobs = await res.json();
        renderJobs(allJobs);
    } catch {
        document.getElementById('jobsGrid').innerHTML = '<p class="page-subtitle" style="color:red">Failed to load jobs.</p>';
    }
}

function renderJobs(jobs) {
    const grid = document.getElementById('jobsGrid');
    if (jobs.length === 0) {
        grid.innerHTML = '<p class="page-subtitle">No jobs found.</p>';
        return;
    }

    grid.innerHTML = jobs.map(job => `
        <div class="job-list-item ${selectedJobId === job.job_id ? 'active' : ''}" onclick="selectJob(${job.job_id})">
            <h3 style="margin-bottom: 4px; font-size: 1.1rem;">${job.title}</h3>
            <p style="color: var(--primary); font-weight: 700; font-size: 0.9rem; margin-bottom: 12px;">${job.company}</p>
            <div class="job-meta" style="margin-bottom: 0;">
                <span class="meta-tag"><i class="fas fa-map-marker-alt" style="margin-right: 4px;"></i>${job.location}</span>
                <span class="meta-tag"><i class="fas fa-clock" style="margin-right: 4px;"></i>${job.type}</span>
            </div>
        </div>
    `).join('');
}

function selectJob(jobId) {
    selectedJobId = jobId;
    const job = allJobs.find(j => j.job_id === jobId);
    renderJobs(allJobs); // Update active state
    renderJobDetail(job);
}

function renderJobDetail(job) {
    const pane = document.getElementById('jobDetailPane');
    if (!job) return;

    pane.innerHTML = `
        <div class="job-detail-header">
            <p class="sub-title" style="margin-bottom: 8px;">${job.company} · ${job.location}</p>
            <h2>${job.title}</h2>
            <div class="job-meta" style="margin-top: 16px;">
                <span class="meta-tag" style="padding: 8px 16px; font-size: 1rem;"><i class="fas fa-money-bill-wave" style="margin-right: 8px; color: #10b981;"></i>${job.salary}</span>
                <span class="meta-tag" style="padding: 8px 16px; font-size: 1rem;"><i class="fas fa-briefcase" style="margin-right: 8px;"></i>${job.type}</span>
            </div>
        </div>
        <div class="job-description">
            <h3 style="margin-bottom: 16px;">About this role</h3>
            <p class="bio-text" style="color: var(--lt-text-muted); font-size: 1rem; line-height: 1.7; margin-bottom: 32px;">
                ${job.description || 'No description provided.'}
            </p>
            <button class="btn-primary" style="width: auto; padding: 16px 40px;" onclick="handleApply('${job.application_link}', ${job.job_id})">
                Apply Now <i class="fas fa-external-link-alt" style="margin-left: 10px; font-size: 0.8rem;"></i>
            </button>
        </div>
    `;
}

function handleApply(link, jobId) {
    // 1. Open external link
    if (link) {
        window.open(link, '_blank');
    } else {
        alert("This job doesn't have an external application link.");
    }

    // 2. Open confirmation modal
    selectedJobIdForTracking = jobId;
    document.getElementById('confirmModal').classList.add('active');
}

let selectedJobIdForTracking = null;

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    selectedJobIdForTracking = null;
    hideModalMessage();
}

async function addToTracker() {
    const btn = document.getElementById('confirmYesBtn');
    btn.disabled = true;
    btn.textContent = 'Tracking...';

    try {
        const res = await fetch(`${API}/api/jobs/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.user_id,
                job_id: selectedJobIdForTracking,
                notes: 'Applied through external link'
            })
        });

        if (res.ok) {
            showModalMessage('Added to your tracker!', 'success');
            setTimeout(() => {
                closeConfirmModal();
            }, 1000);
        } else {
            const data = await res.json();
            showModalMessage(data.detail || 'Failed to add.', 'error');
            btn.disabled = false;
            btn.textContent = 'Yes, track it!';
        }
    } catch {
        showModalMessage('Connection error.', 'error');
        btn.disabled = false;
        btn.textContent = 'Yes, track it!';
    }
}

function filterJobs() {
    const query = document.getElementById('jobSearch').value.toLowerCase();
    const filtered = allJobs.filter(j =>
        j.title.toLowerCase().includes(query) ||
        j.company.toLowerCase().includes(query)
    );
    renderJobs(filtered);
}

function showModalMessage(text, type) {
    const el = document.getElementById('modalMessage');
    el.textContent = text;
    el.style.display = 'block';
    el.className = 'feedback-message ' + (type === 'success' ? 'status-Hired' : 'status-Rejected');
    el.style.marginBottom = '20px';
}

function hideModalMessage() {
    document.getElementById('modalMessage').style.display = 'none';
}

document.getElementById('confirmYesBtn').onclick = addToTracker;

loadJobs();
