import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiPost } from '../api';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.id.replace('register', '').replace('login', '').toLowerCase()]: e.target.value });
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    if (type === 'success' && isLogin) {
      setTimeout(() => navigate('/dashboard'), 1000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password } = formData;

    if (!email || !password || (!isLogin && !name)) {
      showMessage('Please fill all fields', 'error');
      return;
    }

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const body = isLogin ? { email, password } : { name, email, password };
      
      const res = await apiPost(endpoint, body);
      const data = await res.json();

      if (res.ok) {
        if (isLogin) {
          login(data, data.access_token);
          showMessage('Login successful! Redirecting...', 'success');
        } else {
          showMessage('Registration successful! Please login.', 'success');
          setTimeout(() => setIsLogin(true), 2000);
        }
      } else {
        showMessage(data.detail || (isLogin ? 'Invalid credentials' : 'Registration failed'), 'error');
      }
    } catch (err) {
      showMessage('Cannot connect to server. Is the backend running?', 'error');
    }
  };

  return (
    <div className="auth-body">
      <div className="auth-card">
        <h1>Job Tracker</h1>
        <p className="auth-subtitle">
          {isLogin ? 'Login to manage your career' : 'Create an account to get started'}
        </p>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="registerName">Full Name</label>
              <input
                type="text"
                id="registerName"
                className="input-control"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="loginEmail">Email Address</label>
            <input
              type="email"
              id="loginEmail"
              className="input-control"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="loginPassword">Password</label>
            <input
              type="password"
              id="loginPassword"
              className="input-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit" className="btn-primary">
            {isLogin ? 'Login' : 'Create Account'}
          </button>
          <p className="auth-switch">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => { setIsLogin(!isLogin); setMessage({ text: '', type: '' }); }} className="auth-link">
              {isLogin ? 'Sign up' : 'Login'}
            </span>
          </p>
        </form>

        {message.text && (
          <div 
            className="feedback-message" 
            style={{ 
              display: 'block',
              backgroundColor: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              color: message.type === 'success' ? '#059669' : '#DC2626'
            }}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
