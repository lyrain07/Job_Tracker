const API = 'http://localhost:8000';
const user = JSON.parse(localStorage.getItem('user'));

if (!user) {
    window.location.href = 'login.html';
}

document.getElementById('userName').textContent = user.name;
document.getElementById('userGreeting').textContent = user.name;

// Load dashboard data
fetch(API + '/api/dashboard/' + user.user_id)
    .then(res => res.json())
    .then(data => {
        document.getElementById('total').textContent = data.total_applications;
        document.getElementById('applied').textContent = data.applied_count;
        document.getElementById('interviewing').textContent = data.interviewing_count;
        document.getElementById('rejected').textContent = data.rejected_count;
    });

// Load applications
fetch(API + '/api/applications/' + user.user_id)
    .then(res => res.json())
    .then(apps => {
        const tbody = document.getElementById('table');
        
        if (apps.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No applications yet</td></tr>';
            return;
        }

        tbody.innerHTML = apps.map(app => `
            <tr>
                <td>${app.company}</td>
                <td>${app.title}</td>
                <td>${app.type}</td>
                <td>${app.salary}</td>
                <td>${app.date}</td>
                <td><span class="status ${app.status}">${app.status}</span></td>
            </tr>
        `).join('');
    });

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}