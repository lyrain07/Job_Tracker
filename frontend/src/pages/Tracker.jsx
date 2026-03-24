import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPut, apiDelete } from '../api';

const Tracker = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [modalData, setModalData] = useState({ status: '', notes: '', interview_round: null });
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);

  const loadTracker = async () => {
    try {
      const res = await apiGet(`/api/applications/${user.user_id}`);
      if (res.ok) {
        setApplications(await res.json());
      }
    } catch (err) {
      console.error('Tracker load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTracker();
  }, [user.user_id]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this application from your tracker?')) return;
    try {
      const res = await apiDelete(`/api/applications/${id}`);
      if (res.ok) setApplications(apps => apps.filter(a => a.application_id !== id));
    } catch (err) {
      alert('Failed to delete application.');
    }
  };

  const openDetailModal = (app) => {
    setSelectedApp(app);
    setModalData({
      status: app.status,
      notes: app.notes || '',
      interview_round: app.interview_round || 1
    });
  };

  const saveDetails = async () => {
    setSaveLoading(true);
    try {
      const res = await apiPut(`/api/applications/${selectedApp.application_id}`, {
        status: modalData.status,
        notes: modalData.notes,
        interview_round: modalData.status === 'Interviewing' ? modalData.interview_round : null
      });
      if (res.ok) {
        setSelectedApp(null);
        loadTracker();
      }
    } catch (err) {
      alert('Failed to update.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="light-theme">
      <main className="container" style={{ paddingTop: '100px' }}>
        <header className="page-header py-20">
          <div>
            <h1>Application Tracker</h1>
            <p className="page-subtitle">Manage and monitor your job application progress.</p>
          </div>
          <button className="logout-btn" onClick={() => setEditMode(!editMode)}>
            <i className={`fas ${editMode ? 'fa-times' : 'fa-edit'} mr-8`}></i>
            {editMode ? 'Done' : 'Edit Tracker'}
          </button>
        </header>

        <section className="card">
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Job Title</th>
                  <th>Salary</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                  <th>Interview Round</th>
                  <th>Notes</th>
                  {editMode && <th className="edit-col w-80">Action</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="table-loader">Loading tracker...</td></tr>
                ) : applications.length > 0 ? (
                  applications.map((app) => (
                    <tr key={app.application_id} style={{ cursor: 'pointer' }} onClick={() => openDetailModal(app)}>
                      <td><strong>{app.company}</strong></td>
                      <td>{app.title}</td>
                      <td><span className="meta-tag" style={{ background: '#ecfdf5', color: '#065f46', fontWeight: 600 }}>{app.salary || 'N/A'}</span></td>
                      <td>{new Date(app.date).toLocaleDateString()}</td>
                      <td><span className={`status-badge status-${app.status}`}>{app.status}</span></td>
                      <td><span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6366f1' }}>{app.interview_round > 0 ? `Round ${app.interview_round}` : 'None'}</span></td>
                      <td style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.notes || '-'}</td>
                      {editMode && (
                        <td>
                          <button 
                            className="logout-btn" 
                            style={{ background: 'none', borderColor: '#fecaca', color: '#dc2626' }}
                            onClick={(e) => handleDelete(e, app.application_id)}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="8" className="table-empty">No applications yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {selectedApp && (
        <div className="modal-overlay active">
          <div className="modal modal-md">
            <div className="modal-header">
              <h2>{selectedApp.title}</h2>
              <button className="close-btn" onClick={() => setSelectedApp(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="job-detail-header detail-header-clean">
                <p className="sub-title mb-8">{selectedApp.company}</p>
                <div className="job-meta mt-16">
                  <span className="meta-tag">{selectedApp.type || 'N/A'}</span>
                  <span className="meta-tag">{selectedApp.salary || 'N/A'}</span>
                  <span className="meta-tag">Applied: {new Date(selectedApp.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="job-description">
                <h4 className="mb-12 fw-700">Update Application</h4>
                <div className="flex-group">
                  <div className="form-group">
                    <label className="label-sm">Status</label>
                    <select 
                      className="input-control" 
                      value={modalData.status}
                      onChange={(e) => setModalData({...modalData, status: e.target.value})}
                    >
                      <option value="Applied">Applied</option>
                      <option value="Interviewing">Interviewing</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Hired">Hired</option>
                    </select>
                  </div>
                  {modalData.status === 'Interviewing' && (
                    <div className="form-group">
                      <label className="label-sm">Interview Round</label>
                      <select 
                        className="input-control" 
                        value={modalData.interview_round}
                        onChange={(e) => setModalData({...modalData, interview_round: parseInt(e.target.value)})}
                      >
                        {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>Round {r}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <h4 className="mb-12 fw-700">My Notes</h4>
                <textarea 
                  className="input-control notes-input" 
                  value={modalData.notes}
                  onChange={(e) => setModalData({...modalData, notes: e.target.value})}
                  placeholder="Add or edit your note here..."
                ></textarea>
              </div>
              <div className="modal-actions modal-footer">
                <button className="btn-primary" onClick={saveDetails} disabled={saveLoading}>
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button className="logout-btn" onClick={() => setSelectedApp(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tracker;
