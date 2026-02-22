const API = 'https://job-tracker-8e22.onrender.com';

const user = JSON.parse(localStorage.getItem('user'));
if (!user) window.location.href = 'login.html';

let allJobs = [];
let selectedJob = null;
let appliedJobIds = new Set();

async function loadJobs() {
    const list = document.getElementById('jobsList');
    list.innerHTML = '<div class="list-empty"><i class="fas fa-spinner fa-spin"></i><p>Loading jobs...</p></div>';

    try {
        const [jobsRes, appsRes] = await Promise.all([
            fetch(`${API}/api/jobs`),
            fetch(`${API}/api/applications/${user.user_id}`)
        ]);

        if (!jobsRes.ok) throw new Error(`Jobs API error: ${jobsRes.status}`);

        const jobs = await jobsRes.json();
        if (!Array.isArray(jobs)) throw new Error('Invalid jobs response');

        allJobs = jobs;

        if (appsRes.ok) {
            const apps = await appsRes.json();
            if (Array.isArray(apps)) {
                apps.forEach(app => {
                    const match = allJobs.find(j => j.title === app.title && j.company === app.company);
                    if (match) appliedJobIds.add(match.job_id);
                });
            }
        }

        populateLocationFilter(jobs);
        renderJobList(jobs);

        if (jobs.length > 0) {
            const firstItem = document.querySelector('.job-list-item');
            selectJob(jobs[0], firstItem);
        }

    } catch (err) {
        console.error('Failed to load jobs:', err);
        list.innerHTML = `
            <div class="list-empty">
                <i class="fas fa-exclamation-circle" style="color:#f87171;opacity:0.6;"></i>
                <p style="color:#f87171;">Failed to load jobs.<br>
                <small style="color:var(--lt-text-muted);">${err.message}</small></p>
            </div>`;
        document.getElementById('jobsCount').textContent = '0 jobs found';
    }
}

function populateLocationFilter(jobs) {
    const locations = [...new Set(jobs.map(j => j.location).filter(Boolean))].sort();
    const select = document.getElementById('filterLocation');
    select.innerHTML = '<option value="">All Locations</option>';
    locations.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc;
        opt.textContent = loc;
        select.appendChild(opt);
    });
}

function filterJobs() {
    const query = document.getElementById('jobSearch').value.toLowerCase().trim();
    const typeFilter = document.getElementById('filterType').value.toLowerCase();
    const locationFilter = document.getElementById('filterLocation').value.toLowerCase();

    const filtered = allJobs.filter(job => {
        const matchSearch = !query ||
            job.title.toLowerCase().includes(query) ||
            job.company.toLowerCase().includes(query);
        const matchType = !typeFilter || (job.type || '').toLowerCase() === typeFilter;
        const matchLocation = !locationFilter || (job.location || '').toLowerCase() === locationFilter;
        return matchSearch && matchType && matchLocation;
    });

    renderJobList(filtered);
}

function renderJobList(jobs) {
    const list = document.getElementById('jobsList');
    const countEl = document.getElementById('jobsCount');

    countEl.textContent = `${jobs.length} job${jobs.length !== 1 ? 's' : ''} found`;

    if (jobs.length === 0) {
        list.innerHTML = '<div class="list-empty"><i class="fas fa-search"></i><p>No jobs match your filters.</p></div>';
        return;
    }

    list.innerHTML = '';

    jobs.forEach(job => {
        const isApplied = appliedJobIds.has(job.job_id);
        const item = document.createElement('div');
        item.className = 'job-list-item';
        if (selectedJob && selectedJob.job_id === job.job_id) item.classList.add('active');

        item.innerHTML = `
            <div class="job-item-title">${escHtml(job.title)}</div>
            <div class="job-item-company">${escHtml(job.company)}</div>
            <div class="job-item-tags">
                ${job.type ? `<span class="job-item-tag">${escHtml(job.type)}</span>` : ''}
                ${job.location ? `<span class="job-item-tag">${escHtml(job.location)}</span>` : ''}
                ${job.salary ? `<span class="job-item-tag">${escHtml(job.salary)}</span>` : ''}
                ${isApplied ? `<span class="job-item-tag" style="background:#ecfdf5;color:#059669;">✓ Applied</span>` : ''}
            </div>`;

        item.addEventListener('click', () => selectJob(job, item));
        list.appendChild(item);
    });
}

function selectJob(job, itemEl) {
    selectedJob = job;
    document.querySelectorAll('.job-list-item').forEach(el => el.classList.remove('active'));
    if (itemEl) itemEl.classList.add('active');
    renderJobDetail(job);
}

function renderJobDetail(job) {
    const isApplied = appliedJobIds.has(job.job_id);
    const detail = document.getElementById('jobDetail');

    detail.innerHTML = `
        <div class="detail-action-bar">
            ${job.application_link ? `
            <a href="${escAttr(job.application_link)}" target="_blank" rel="noopener noreferrer" class="btn-ext-link">
                <i class="fas fa-external-link-alt"></i> Apply Externally
            </a>` : ''}
            <button
                class="btn-track ${isApplied ? 'tracked' : ''}"
                id="trackBtn"
                onclick="openConfirmModal()"
                ${isApplied ? 'disabled' : ''}>
                ${isApplied
            ? '<i class="fas fa-check"></i> Already Tracked'
            : '<i class="fas fa-bookmark"></i> Apply'}
            </button>
        </div>

        <div class="detail-scroll-area">
            <div class="job-detail-title">${escHtml(job.title)}</div>
            <div class="job-detail-company">${escHtml(job.company)}</div>
            <div class="job-detail-tags">
                ${job.type ? `<span class="detail-tag"><i class="fas fa-briefcase"></i>${escHtml(job.type)}</span>` : ''}
                ${job.location ? `<span class="detail-tag"><i class="fas fa-map-marker-alt"></i>${escHtml(job.location)}</span>` : ''}
                ${job.salary ? `<span class="detail-tag"><i class="fas fa-dollar-sign"></i>${escHtml(job.salary)}</span>` : ''}
            </div>

            ${job.description ? `
            <div class="job-desc-label">Job Description</div>
            <p class="job-desc-text">${escHtml(job.description).replace(/\n/g, '<br>')}</p>
            ` : '<p style="color:var(--lt-text-muted);">No description available.</p>'}
        </div>`;
}

function openConfirmModal() {
    if (!selectedJob) return;
    document.getElementById('modalJobTitle').textContent = selectedJob.title;
    document.getElementById('modalJobCompany').textContent = selectedJob.company;

    const msg = document.getElementById('feedbackMsg');
    msg.className = 'feedback-message';
    msg.style.display = 'none';
    msg.textContent = '';

    const btn = document.getElementById('confirmYesBtn');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-bookmark"></i> Yes, track it!';

    document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

async function confirmApply() {
    if (!selectedJob || !user) return;

    const btn = document.getElementById('confirmYesBtn');
    const msg = document.getElementById('feedbackMsg');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const res = await fetch(`${API}/api/jobs/apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.user_id, job_id: selectedJob.job_id, notes: '' })
        });

        const data = await res.json();

        if (res.ok) {
            appliedJobIds.add(selectedJob.job_id);
            msg.textContent = '✓ Added to your tracker!';
            msg.className = 'feedback-message feedback-success';
            msg.style.display = 'block';
            btn.innerHTML = '<i class="fas fa-check"></i> Done!';
            filterJobs();
            renderJobDetail(selectedJob);
            setTimeout(closeConfirmModal, 1800);
        } else {
            const errText = data.detail || 'Failed to track application.';
            if (errText.toLowerCase().includes('already applied')) {
                appliedJobIds.add(selectedJob.job_id);
                msg.textContent = 'Already tracked!';
                msg.className = 'feedback-message feedback-success';
                filterJobs();
                renderJobDetail(selectedJob);
                setTimeout(closeConfirmModal, 1800);
            } else {
                msg.textContent = errText;
                msg.className = 'feedback-message feedback-error';
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-bookmark"></i> Yes, track it!';
            }
            msg.style.display = 'block';
        }
    } catch (err) {
        console.error('Apply error:', err);
        msg.textContent = 'Connection error. Please try again.';
        msg.className = 'feedback-message feedback-error';
        msg.style.display = 'block';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-bookmark"></i> Yes, track it!';
    }
}

function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escAttr(str) {
    if (!str) return '#';
    return /^https?:\/\//i.test(str) ? str : '#';
}

document.getElementById('confirmModal').addEventListener('click', function (e) {
    if (e.target === this) closeConfirmModal();
});

loadJobs();