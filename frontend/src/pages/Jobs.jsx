import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPost } from '../api';

const Jobs = () => {
  const { user } = useAuth();
  const [allJobs, setAllJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ type: '', location: '' });
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', type: '' });

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const [jobsRes, appsRes] = await Promise.all([
          apiGet('/api/jobs'),
          apiGet(`/api/applications/${user.user_id}`)
        ]);

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setAllJobs(jobsData);
          setFilteredJobs(jobsData);
          if (jobsData.length > 0) setSelectedJob(jobsData[0]);
        }

        if (appsRes.ok) {
          const appsData = await appsRes.json();
          const appliedIds = new Set();
          appsData.forEach(app => {
            // Find match in current job list to track which IDs are already applied
            // Note: In original code they match by title/company, but using ID is better if possible.
            // Original logic: const match = allJobs.find(j => j.title === app.title && j.company === app.company);
            // I'll keep the direct title/company matching for strict behavior preservation or ID if backend provides it.
          });
          // Since the API returns applications with job_id potentially (based on backend code), I'll use that.
          appsData.forEach(app => {
            // Match based on title and company as the vanilla JS did
            const jobMatch = allJobs.find(j => j.title === app.title && j.company === app.company);
            if (jobMatch) appliedIds.add(jobMatch.job_id);
          });
          // Fix: allJobs might not be populated yet due to Promise.all. 
          // Let's refine this after the data is set.
        }
      } catch (err) {
        console.error('Jobs load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, [user.user_id]);

  // Handle applied IDs once jobs and apps are both available
  useEffect(() => {
    if (allJobs.length > 0) {
      apiGet(`/api/applications/${user.user_id}`).then(res => res.json()).then(apps => {
        const appliedIds = new Set();
        apps.forEach(app => {
          const match = allJobs.find(j => j.title === app.title && j.company === app.company);
          if (match) appliedIds.add(match.job_id);
        });
        setAppliedJobIds(appliedIds);
      });
    }
  }, [allJobs, user.user_id]);

  useEffect(() => {
    const filtered = allJobs.filter(job => {
      const matchSearch = !searchTerm || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        job.company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = !filters.type || (job.type || '').includes(filters.type);
      const matchLocation = !filters.location || (job.location || '').includes(filters.location);
      return matchSearch && matchType && matchLocation;
    });
    setFilteredJobs(filtered);
  }, [searchTerm, filters, allJobs]);

  const handleApply = async () => {
    setModalLoading(true);
    try {
      const res = await apiPost('/api/jobs/apply', {
        user_id: user.user_id,
        job_id: selectedJob.job_id,
        notes: ''
      });
      const data = await res.json();

      if (res.ok) {
        setAppliedJobIds(prev => new Set(prev).add(selectedJob.job_id));
        setFeedback({ text: '✓ Added to your tracker!', type: 'success' });
        setTimeout(() => {
          setIsModalOpen(false);
          setFeedback({ text: '', type: '' });
        }, 1800);
      } else {
        const errText = data.detail || 'Failed to track application.';
        if (errText.toLowerCase().includes('already applied')) {
           setAppliedJobIds(prev => new Set(prev).add(selectedJob.job_id));
           setFeedback({ text: 'Already tracked!', type: 'success' });
           setTimeout(() => setIsModalOpen(false), 1800);
        } else {
          setFeedback({ text: errText, type: 'error' });
        }
      }
    } catch (err) {
      setFeedback({ text: 'Connection error. Please try again.', type: 'error' });
    } finally {
      setModalLoading(false);
    }
  };

  const locations = [...new Set(allJobs.map(j => j.location).filter(Boolean))].sort();

  const [isDetailActive, setIsDetailActive] = useState(false);

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setIsDetailActive(true);
  };

  return (
    <div className="light-theme" style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="page-shell" style={{ paddingTop: '70px' }}>
        <div className="page-top-bar" style={{ display: isDetailActive ? 'none' : 'block' }}>
          <h1>Browse Jobs</h1>
        </div>

        <div className={`jobs-layout ${isDetailActive ? 'detail-active' : ''}`}>
          <div className="jobs-left">
            <div className="jobs-left-header">
              <div className="search-wrapper">
                <i className="fas fa-search"></i>
                <input 
                  type="text" 
                  className="jobs-search-input" 
                  placeholder="Search title or company..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="filter-row">
                <select 
                  className="filter-select" 
                  value={filters.type}
                  onChange={(e) => setFilters({...filters, type: e.target.value})}
                >
                  <option value="">All Types</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                </select>
                <select 
                  className="filter-select"
                  value={filters.location}
                  onChange={(e) => setFilters({...filters, location: e.target.value})}
                >
                  <option value="">All Locations</option>
                  {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                </select>
              </div>
              <p className="jobs-count">{filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found</p>
            </div>
            <div className="jobs-list">
              {loading ? (
                <div className="list-empty"><i className="fas fa-spinner fa-spin"></i><p>Loading jobs...</p></div>
              ) : filteredJobs.length > 0 ? (
                filteredJobs.map(job => (
                  <div 
                    key={job.job_id} 
                    className={`job-list-item ${selectedJob?.job_id === job.job_id ? 'active' : ''}`}
                    onClick={() => handleJobClick(job)}
                  >
                    <div className="job-item-title">{job.title}</div>
                    <div className="job-item-company">{job.company}</div>
                    <div className="job-item-tags">
                      {job.type && <span className="job-item-tag">{job.type}</span>}
                      {job.location && <span className="job-item-tag">{job.location}</span>}
                      {job.salary && <span className="job-item-tag">{job.salary}</span>}
                      {appliedJobIds.has(job.job_id) && <span className="job-item-tag" style={{ background: '#ecfdf5', color: '#059669' }}>✓ Applied</span>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="list-empty"><i className="fas fa-search"></i><p>No jobs match your filters.</p></div>
              )}
            </div>
          </div>

          <div className="jobs-right">
            {selectedJob ? (
              <>
                <div className="detail-action-bar">
                  <button className="btn-back-mobile" onClick={() => setIsDetailActive(false)}>
                    <i className="fas fa-arrow-left"></i> Back to Jobs
                  </button>
                  {selectedJob.application_link && (
                    <a href={selectedJob.application_link} target="_blank" rel="noopener noreferrer" className="btn-ext-link" style={{ marginLeft: 'auto' }}>
                      <i className="fas fa-external-link-alt"></i> Apply
                    </a>
                  )}
                  <button 
                    className={`btn-track ${appliedJobIds.has(selectedJob.job_id) ? 'tracked' : ''}`}
                    onClick={() => setIsModalOpen(true)}
                    disabled={appliedJobIds.has(selectedJob.job_id)}
                    style={{ flex: 'none', width: 'auto' }}
                  >
                    {appliedJobIds.has(selectedJob.job_id) 
                      ? <><i className="fas fa-check"></i> Tracked</> 
                      : <><i className="fas fa-bookmark"></i> Track It</>}
                  </button>
                </div>
                <div className="detail-scroll-area">
                  <div className="job-detail-title">{selectedJob.title}</div>
                  <div className="job-detail-company">{selectedJob.company}</div>
                  <div className="job-detail-tags">
                    {selectedJob.type && <span className="detail-tag"><i className="fas fa-briefcase"></i>{selectedJob.type}</span>}
                    {selectedJob.location && <span className="detail-tag"><i className="fas fa-map-marker-alt"></i>{selectedJob.location}</span>}
                    {selectedJob.salary && <span className="detail-tag"><i className="fas fa-dollar-sign"></i>{selectedJob.salary}</span>}
                  </div>
                  <div className="job-desc-label">Job Description</div>
                  <p className="job-desc-text" dangerouslySetInnerHTML={{ __html: (selectedJob.description || 'No description available.').replace(/\n/g, '<br>') }}></p>
                </div>
              </>
            ) : (
              <div className="detail-empty">
                <i className="fas fa-briefcase"></i>
                <p>Select a job to see details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay active">
          <div className="modal" style={{ maxWidth: '420px', textAlign: 'center', padding: '36px 32px' }}>
            <div className="modal-icon"><i className="fas fa-check-circle"></i></div>
            <h2>Did you apply?</h2>
            <p className="modal-subtitle">We'll add this to your tracker only if you've already submitted your application externally.</p>
            <div className="modal-job-info">
              <div className="mj-title">{selectedJob?.title}</div>
              <div className="mj-company">{selectedJob?.company}</div>
            </div>
            {feedback.text && (
              <div className={`feedback-message feedback-${feedback.type}`} style={{ display: 'block' }}>
                {feedback.text}
              </div>
            )}
            <div className="modal-actions">
              <button className="logout-btn" onClick={() => setIsModalOpen(false)}>Not yet</button>
              <button className="btn-track" onClick={handleApply} disabled={modalLoading}>
                {modalLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-bookmark"></i>} Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
