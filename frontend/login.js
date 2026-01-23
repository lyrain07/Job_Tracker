const API = 'http://localhost:8000';

function showLogin() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
    document.getElementById('loginTab').classList.add('active');
    document.getElementById('registerTab').classList.remove('active');
}

function showRegister() {
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('registerForm').classList.add('active');
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('registerTab').classList.add('active');
}

function showMessage(msg, type) {
    const div = document.getElementById('message');
    div.textContent = msg;
    div.className = 'message show ' + type;
}

async function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    if (!name || !email || !password) {
        showMessage('Fill all fields', 'error');
        return;
    }

    try {
        const response = await fetch(API + '/api/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, email, password})
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Success! Now login.', 'success');
            setTimeout(showLogin, 2000);
        } else {
            showMessage(data.detail, 'error');
        }
    } catch (error) {
        showMessage('Backend not running!', 'error');
    }
}

async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showMessage('Fill all fields', 'error');
        return;
    }

    try {
        const response = await fetch(API + '/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password})
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('user', JSON.stringify(data));
            showMessage('Login success!', 'success');
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } else {
            showMessage(data.detail, 'error');
        }
    } catch (error) {
        showMessage('Backend not running!', 'error');
    }
}