const API = 'http://localhost:8000';
const user = JSON.parse(localStorage.getItem('user'));
if (!user) window.location.href = 'login.html';

let allSkills = [];
let userSkillIds = [];

// ─── Load Profile ─────────────────────────────────────────────

async function loadProfile() {
    try {
        const res = await fetch(`${API}/api/profile/${user.user_id}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        document.getElementById('userInitial').textContent = data.name.charAt(0).toUpperCase();
        document.getElementById('sideBarName').textContent = data.name;
        document.getElementById('sideBarEmail').textContent = data.email;
        document.getElementById('profileBio').textContent = data.bio || 'No bio yet. Click "Edit Your Profile" to add one!';

        const resumeBadge = document.getElementById('resumeBadge');
        if (data.resume_url) {
            resumeBadge.href = data.resume_url;
            resumeBadge.innerHTML = '<i class="fas fa-file-pdf" style="margin-right:6px;"></i> View Resume';
            resumeBadge.style.background = '#ECFDF5';
            resumeBadge.style.color = '#059669';
        } else {
            resumeBadge.href = '#';
            resumeBadge.innerHTML = '<i class="fas fa-file-pdf" style="margin-right:6px;"></i> No Resume Yet';
            resumeBadge.style.background = '#f1f5f9';
            resumeBadge.style.color = '#94a3b8';
        }

        document.getElementById('editName').value = data.name;
        document.getElementById('editBio').value = data.bio || '';
        document.getElementById('editResume').value = data.resume_url || '';

        userSkillIds = Array.isArray(data.skills) ? data.skills.map(s => s.id) : [];
        renderProfileSkills(Array.isArray(data.skills) ? data.skills : []);

    } catch (err) {
        console.error('Error loading profile:', err);
        document.getElementById('skillsList').innerHTML =
            '<p style="color:#F87171">Failed to load profile. Is the backend running at ' + API + '?</p>';
    }
}

function renderProfileSkills(skills) {
    const container = document.getElementById('skillsList');
    if (!skills || skills.length === 0) {
        container.innerHTML = '<p style="color: #94a3b8;">No skills added yet. Click "Manage Skills" to add some.</p>';
        return;
    }
    container.innerHTML = skills.map(skill => `
        <span style="background: rgba(99,102,241,0.1); color: #6366F1; padding: 6px 14px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">${skill.name}</span>
    `).join('');
}

// ─── Edit Profile Modal ───────────────────────────────────────

function openEditModal() {
    document.getElementById('editModal').classList.add('active');
    document.getElementById('profileMessage').style.display = 'none';
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

async function saveProfile() {
    const name = document.getElementById('editName').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    const resume_url = document.getElementById('editResume').value.trim();

    if (!name) { showProfileMessage('Name is required.', 'error'); return; }

    try {
        const res = await fetch(`${API}/api/profile/${user.user_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, bio, resume_url, linkedin_url: '', github_url: '', twitter_url: '' })
        });

        if (res.ok) {
            showProfileMessage('Profile updated!', 'success');
            localStorage.setItem('user', JSON.stringify({ ...user, name }));
            setTimeout(() => { closeEditModal(); loadProfile(); }, 1000);
        } else {
            const err = await res.json();
            showProfileMessage(err.detail || 'Failed to update.', 'error');
        }
    } catch {
        showProfileMessage('Connection error.', 'error');
    }
}

// ─── Skills Modal ─────────────────────────────────────────────

async function openSkillsModal() {
    document.getElementById('skillsModal').classList.add('active');
    document.getElementById('skillsMessage').style.display = 'none';
    document.getElementById('selectedSkillsList').innerHTML = '<p style="color:#94a3b8; font-size:0.85rem;">Loading...</p>';

    try {
        const res = await fetch(`${API}/api/skills`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        allSkills = await res.json();
        if (!Array.isArray(allSkills)) throw new Error('Bad response');
        renderSelectedSkills();
        renderSkillDropdown('');
    } catch (err) {
        document.getElementById('selectedSkillsList').innerHTML =
            '<p style="color:#F87171">Failed to load skills from backend.</p>';
    }
}

function closeSkillsModal() {
    document.getElementById('skillsModal').classList.remove('active');
    document.getElementById('skillSearchInput').value = '';
    document.getElementById('skillDropdown').style.display = 'none';
}

// Renders the selected skill tags at the top of the modal
function renderSelectedSkills() {
    const container = document.getElementById('selectedSkillsList');
    const selected = allSkills.filter(s => userSkillIds.includes(s.id));
    if (selected.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; font-size:0.85rem;">No skills selected yet. Search and add below.</p>';
        return;
    }
    container.innerHTML = selected.map(skill => `
        <span style="display:inline-flex; align-items:center; gap:6px; background:#6366F1; color:white; padding:5px 12px; border-radius:20px; font-size:0.82rem; font-weight:600;">
            ${skill.name}
            <span onclick="removeSkill(${skill.id})" style="cursor:pointer; opacity:0.8; font-size:1rem; line-height:1;">&times;</span>
        </span>
    `).join('');
}

// Renders the dropdown list filtered by search
function renderSkillDropdown(query) {
    const dropdown = document.getElementById('skillDropdown');
    const filtered = allSkills.filter(s =>
        !userSkillIds.includes(s.id) &&
        s.name.toLowerCase().includes(query.toLowerCase())
    );

    if (filtered.length === 0) {
        dropdown.style.display = 'none';
        return;
    }

    dropdown.style.display = 'block';
    dropdown.innerHTML = filtered.map(skill => `
        <div onclick="addSkill(${skill.id})" style="padding:10px 14px; cursor:pointer; font-size:0.9rem; border-bottom:1px solid #f1f5f9; transition:background 0.15s;"
             onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
            ${skill.name}
        </div>
    `).join('');
}

function addSkill(skillId) {
    if (!userSkillIds.includes(skillId)) {
        userSkillIds.push(skillId);
    }
    document.getElementById('skillSearchInput').value = '';
    document.getElementById('skillDropdown').style.display = 'none';
    renderSelectedSkills();
}

function removeSkill(skillId) {
    userSkillIds = userSkillIds.filter(id => id !== skillId);
    renderSelectedSkills();
    // Re-render dropdown if search is active
    const q = document.getElementById('skillSearchInput').value;
    if (q) renderSkillDropdown(q);
}

async function saveSkills() {
    const selectedSkillNames = allSkills
        .filter(s => userSkillIds.includes(s.id))
        .map(s => s.name);

    try {
        const res = await fetch(`${API}/api/user/skills/${user.user_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skill_names: selectedSkillNames })
        });

        if (res.ok) {
            showSkillsMessage('Skills saved!', 'success');
            loadProfile();
            setTimeout(closeSkillsModal, 1000);
        } else {
            const err = await res.json();
            showSkillsMessage(err.detail || 'Failed to save.', 'error');
        }
    } catch {
        showSkillsMessage('Connection error.', 'error');
    }
}

// ─── Helpers ──────────────────────────────────────────────────

function showProfileMessage(msg, type) {
    const el = document.getElementById('profileMessage');
    el.textContent = msg;
    el.style.display = 'block';
    el.style.backgroundColor = type === 'success' ? '#ECFDF5' : '#FEF2F2';
    el.style.color = type === 'success' ? '#059669' : '#DC2626';
    el.style.padding = '10px 16px';
    el.style.borderRadius = '8px';
}

function showSkillsMessage(msg, type) {
    const el = document.getElementById('skillsMessage');
    el.textContent = msg;
    el.style.display = 'block';
    el.style.backgroundColor = type === 'success' ? '#ECFDF5' : '#FEF2F2';
    el.style.color = type === 'success' ? '#059669' : '#DC2626';
    el.style.padding = '10px 16px';
    el.style.borderRadius = '8px';
}

loadProfile();