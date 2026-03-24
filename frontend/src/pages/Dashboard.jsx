import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_applications: 0,
    interviewing_count: 0,
    rejected_count: 0,
    hired_count: 0
  });
  const [recentApps, setRecentApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, appsRes] = await Promise.all([
          apiGet(`/api/dashboard/${user.user_id}`),
          apiGet(`/api/applications/${user.user_id}`)
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (appsRes.ok) {
          const appsData = await appsRes.json();
          setRecentApps(appsData.slice(0, 5));
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user.user_id]);

  return (
    <div className="light-theme">
      <main className="container" style={{ paddingTop: '80px' }}>
        <header className="page-header">
          <div>
            <h1>Hello, <span id="userGreeting">{user?.name?.split(' ')[0] || 'Candidate'}</span>!</h1>
            <p className="page-subtitle">Here's what's happening with your applications today.</p>
          </div>
        </header>

        <section className="stats-grid">
          <div className="stat-card">
            <div className="label">Total Applications</div>
            <div className="value">{stats.total_applications}</div>
          </div>
          <div className="stat-card">
            <div className="label">Interviewing</div>
            <div className="value value--yellow">{stats.interviewing_count}</div>
          </div>
          <div className="stat-card">
            <div className="label">Rejected</div>
            <div className="value value--red">{stats.rejected_count}</div>
          </div>
          <div className="stat-card">
            <div className="label">Offers / Hired</div>
            <div className="value value--green">{stats.hired_count}</div>
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <h2>Recent Applications</h2>
            <Link to="/tracker" className="link-action">View All Tracker →</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Job Title</th>
                  <th>Salary</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                  <th>Interview Round</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="table-empty">Loading applications...</td></tr>
                ) : recentApps.length > 0 ? (
                  recentApps.map((app) => (
                    <tr key={app.application_id}>
                      <td><strong>{app.company}</strong></td>
                      <td>{app.title}</td>
                      <td>
                        <span className="meta-tag" style={{ background: '#ecfdf5', color: '#065f46', fontWeight: 600 }}>
                          {app.salary || 'N/A'}
                        </span>
                      </td>
                      <td>{new Date(app.date).toLocaleDateString()}</td>
                      <td><span className={`status-badge status-${app.status}`}>{app.status}</span></td>
                      <td>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6366f1' }}>
                          {app.interview_round > 0 ? `Round ${app.interview_round}` : 'None'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" className="table-empty">No applications yet. Start applying!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
