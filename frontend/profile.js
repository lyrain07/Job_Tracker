const API = 'http://127.0.0.1:8000';
const user = JSON.parse(localStorage.getItem('user'));
if (!user) window.location.href = 'login.html';

let currentUserSkills = []; // List of string names

// Load Profile
async function loadProfile() {
    try {
        const res = await fetch(`${API}/api/profile/${user.user_id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();

        // Resume Badge Styling
        const badge = document.getElementById('resumeBadge');
        if (data.resume_url) {
            badge.style.display = 'block';
            badge.className = 'status-badge status-Passed';
            badge.style.cursor = 'pointer';
            badge.onclick = () => window.open(data.resume_url, '_blank');
        } else {
            badge.style.display = 'block';
            badge.className = 'status-badge';
            badge.style.background = '#f1f5f9';
            badge.style.color = '#94a3b8';
            badge.style.cursor = 'default';
            badge.onclick = null;
        }

        // Social Links
        const links = {
            'linkLinkedin': data.linkedin_url,
            'linkGithub': data.github_url,
            'linkTwitter': data.twitter_url
        };

        for (const [id, url] of Object.entries(links)) {
            const el = document.getElementById(id);
            if (url) {
                el.href = url;
                el.style.display = 'inline-flex';
            } else {
                el.style.display = 'none';
            }
        }

        document.getElementById('profileBio').textContent = data.bio || "No bio added yet.";

        // Setup Edit Fields
        document.getElementById('editBio').value = data.bio || '';
        document.getElementById('editResume').value = data.resume_url || '';
        document.getElementById('editLinkedin').value = data.linkedin_url || '';
        document.getElementById('editGithub').value = data.github_url || '';
        document.getElementById('editTwitter').value = data.twitter_url || '';

        // Load Skills
        currentUserSkills = data.skills.map(s => s.name);
        renderProfileSkills();

    } catch (err) {
        console.error("Load failed", err);
    }
}

function renderProfileSkills() {
    const list = document.getElementById('skillsList');
    if (currentUserSkills.length === 0) {
        list.innerHTML = '<p class="page-subtitle" style="grid-column: 1/-1;">No skills added yet.</p>';
        return;
    }

    list.innerHTML = currentUserSkills.map(skill => `
        <div class="skill-card">
            <i class="fas fa-check-circle" style="color: var(--primary); font-size: 0.8rem;"></i>
            <span>${skill}</span>
        </div>
    `).join('');
}

// Edit Profile Modal
function openEditModal() {
    document.getElementById('editModal').classList.add('active');
    hideProfileMessage();
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

async function saveProfile() {
    const bio = document.getElementById('editBio').value;
    const resume = document.getElementById('editResume').value;
    const linkedin = document.getElementById('editLinkedin').value;
    const github = document.getElementById('editGithub').value;
    const twitter = document.getElementById('editTwitter').value;

    try {
        const res = await fetch(`${API}/api/profile/${user.user_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: user.name, // Required by backend model
                bio,
                resume_url: resume,
                linkedin_url: linkedin,
                github_url: github,
                twitter_url: twitter
            })
        });

        if (res.ok) {
            showProfileMessage("Profile updated!", "success");
            setTimeout(() => {
                closeEditModal();
                loadProfile();
            }, 1000);
        } else {
            showProfileMessage("Update failed.", "error");
        }
    } catch {
        showProfileMessage("Connection error.", "error");
    }
}

// Skills Modal (Tag System)
function openSkillsModal() {
    document.getElementById('skillsModal').classList.add('active');
    renderTags();
    hideSkillsMessage();
}

function closeSkillsModal() {
    document.getElementById('skillsModal').classList.remove('active');
}

function renderTags() {
    const container = document.getElementById('tagContainer');
    const input = document.getElementById('skillInput');

    // Clear old tags (keeping the input)
    const existingTags = container.querySelectorAll('.tag-item');
    existingTags.forEach(t => t.remove());

    currentUserSkills.forEach((skill, index) => {
        const tag = document.createElement('div');
        tag.className = 'tag-item';
        tag.innerHTML = `
            ${skill}
            <span class="tag-remove" onclick="removeSkillTag(${index})">&times;</span>
        `;
        container.insertBefore(tag, input);
    });
}

function removeSkillTag(index) {
    currentUserSkills.splice(index, 1);
    renderTags();
}

async function saveSkills() {
    const btn = document.querySelector('#skillsModal .btn-primary');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const res = await fetch(`${API}/api/user/skills/${user.user_id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ skill_names: currentUserSkills })
        });

        if (res.ok) {
            showSkillsMessage("Skills saved!", "success");
            setTimeout(() => {
                closeSkillsModal();
                loadProfile();
            }, 1000);
        } else {
            showSkillsMessage("Failed to save.", "error");
        }
    } catch {
        showSkillsMessage("Connection error.", "error");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Changes';
    }
}

// Input listener for tags
document.getElementById('skillInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const val = e.target.value.trim();
        if (val && !currentUserSkills.includes(val)) {
            currentUserSkills.push(val);
            e.target.value = '';
            renderTags();
        }
    }
});

function showProfileMessage(txt, type) {
    const el = document.getElementById('profileMessage');
    el.textContent = txt;
    el.style.display = 'block';
    el.className = 'feedback-message ' + (type === 'success' ? 'status-Hired' : 'status-Rejected');
}

function hideProfileMessage() {
    document.getElementById('profileMessage').style.display = 'none';
}

function showSkillsMessage(txt, type) {
    const el = document.getElementById('skillsMessage');
    el.textContent = txt;
    el.style.display = 'block';
    el.className = 'feedback-message ' + (type === 'success' ? 'status-Hired' : 'status-Rejected');
}

function hideSkillsMessage() {
    document.getElementById('skillsMessage').style.display = 'none';
}

loadProfile();
