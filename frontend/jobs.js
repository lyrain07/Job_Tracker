const API = 'http://localhost:8000';

const user = JSON.parse(localStorage.getItem('user'));
if (!user) window.location.href = 'login.html';

let allJobs = [];
let selectedJobId = null;

async function loadJobs() {
    const grid = document.getElementById('jobsGrid');
    grid.innerHTML = '<div class="loading-placeholder"><p class="page-subtitle">Loading jobs...</p></div>';

    try {
        const res = await fetch(`${API}/api/jobs`);

        // Log status to help debug
        console.log('Jobs API status:', res.status);

        if (!res.ok) {
            const errText = await res.text();
            console.error('Jobs API error body:', errText);
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        console.log('Jobs loaded:', data);

        if (!Array.isArray(data)) throw new Error('Response is not an array');

        allJobs = data;
        renderJobs(allJobs);

    } catch (err) {
        console.error('Failed to load jobs:', err);
        grid.innerHTML = `
            <div class="loading-placeholder">
                <p class="page-subtitle" style="color:#F87171">
                    ⚠️ Failed to load jobs (${err.message})<br>
                    <small style="color:#94a3b8; margin-top:8px; display:block;">
                        Check: backend running at <strong>${API}</strong>?
                        Open browser console (F12) for details.
                    </small>
                </p>
            </div>`;
    }
}

function renderJobs(jobs) {
    const grid = document.getElementById('jobsGrid');
    if (jobs.length === 0) {
        grid.innerHTML = '<div class="loading-placeholder"><p class="page-subtitle">No jobs found.</p></div>';
        return;
    }

    // Use data-index to avoid any string escaping issues with job title/company
    grid.innerHTML = jobs.map((job, i) => `
        <div class="job-card" data-index="${i}">
            <h3>${job.title}</h3>
            <div class="company">${job.company}</div>
            <div class="job-meta">
                <span class="meta-tag">💼 ${job.type || 'Full-time'}</span>
                <span class="meta-tag">📍 ${job.location || 'Remote'}</span>
                <span class="meta-tag">💰 ${job.salary || 'Competitive'}</span>
            </div>
            <button class="btn-primary apply-btn">Apply Now</button>
        </div>
    `).join('');

    // Attach click listeners after render — avoids apostrophe/quote breaking onclick
    grid.querySelectorAll('.job-card').forEach(card => {
        const job = jobs[parseInt(card.dataset.index)];
        card.querySelector('.apply-btn').addEventListener('click', () => {
            openApplyModal(job.job_id, job.title, job.company);
        });
    });
}

function filterJobs() {
    const query = document.getElementById('jobSearch').value.toLowerCase();
    const matches = allJobs.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        (job.location || '').toLowerCase().includes(query)
    );
    renderJobs(matches);
}

function openApplyModal(jobId, title, company) {
    selectedJobId = jobId;
    document.getElementById('modalJobTitle').textContent = `Apply for ${title}`;
    document.getElementById('modalCompany').textContent = company;
    document.getElementById('applyNotes').value = '';
    document.getElementById('applyModal').classList.add('active');
    const msg = document.getElementById('modalMessage');
    if (msg) msg.style.display = 'none';
}

function closeModal() {
    document.getElementById('applyModal').classList.remove('active');
    selectedJobId = null;
}

async function confirmApply() {
    const notes = document.getElementById('applyNotes').value;
    const btn = document.getElementById('confirmApplyBtn');
    btn.disabled = true;
    btn.textContent = 'Applying...';

    try {
        const res = await fetch(`${API}/api/jobs/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.user_id, job_id: selectedJobId, notes })
        });
        const data = await res.json();
        const msgEl = document.getElementById('modalMessage');
        if (res.ok) {
            msgEl.textContent = 'Application submitted successfully!';
            msgEl.style.display = 'block';
            msgEl.style.backgroundColor = '#ECFDF5';
            msgEl.style.color = '#059669';
            setTimeout(closeModal, 1500);
        } else {
            msgEl.textContent = data.detail || 'Failed to apply. You may have already applied.';
            msgEl.style.display = 'block';
            msgEl.style.backgroundColor = '#FEF2F2';
            msgEl.style.color = '#DC2626';
        }
    } catch {
        const msgEl = document.getElementById('modalMessage');
        msgEl.textContent = 'Connection error. Try again.';
        msgEl.style.display = 'block';
        msgEl.style.backgroundColor = '#FEF2F2';
        msgEl.style.color = '#DC2626';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Confirm Application';
    }
}

document.getElementById('confirmApplyBtn').addEventListener('click', confirmApply);
loadJobs();