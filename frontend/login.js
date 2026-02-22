const API = 'https://jobtracker-production-d93f.up.railway.app';


function showLoginPage() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('authSubtitle').textContent = 'Login to manage your career';
    hideMessage();
}

function showRegisterPage() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('authSubtitle').textContent = 'Create an account to get started';
    hideMessage();
}



function showMessage(text, type) {
    const el = document.getElementById('message');
    el.textContent = text;
    el.style.display = 'block';
    el.style.backgroundColor = type === 'success' ? '#ECFDF5' : '#FEF2F2';
    el.style.color = type === 'success' ? '#059669' : '#DC2626';
}

function hideMessage() {
    document.getElementById('message').style.display = 'none';
}



async function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    if (!name || !email || !password) {
        showMessage('Please fill all fields', 'error');
        return;
    }

    try {
        const res = await fetch(`${API}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        let data;
        try {
            data = await res.json();
        } catch (e) {
            data = { detail: 'Server error occurred' };
        }

        if (res.ok) {
            showMessage('Registration successful! Please login.', 'success');
            setTimeout(showLoginPage, 2000);
        } else {
            // Handle validation errors (array of objects) or single string detail
            const msg = Array.isArray(data.detail)
                ? data.detail.map(d => d.msg).join(', ')
                : data.detail || 'Registration failed';
            showMessage(msg, 'error');
        }
    } catch (err) {
        console.error('Registration error:', err);
        showMessage('Cannot connect to server. Check your internet or if the backend is down.', 'error');
    }
}



async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        showMessage('Please fill all fields', 'error');
        return;
    }

    try {
        const res = await fetch(`${API}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        let data;
        try {
            data = await res.json();
        } catch (e) {
            data = { detail: 'Server error occurred' };
        }

        if (res.ok) {
            localStorage.setItem('user', JSON.stringify(data));
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } else {
            const msg = Array.isArray(data.detail)
                ? data.detail.map(d => d.msg).join(', ')
                : data.detail || 'Invalid email or password';
            showMessage(msg, 'error');
        }
    } catch (err) {
        console.error('Login error:', err);
        showMessage('Cannot connect to server. Check your internet or if the backend is down.', 'error');
    }
}
