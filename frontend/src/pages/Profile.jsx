import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiGet, apiPut, apiPost } from '../api';

const Profile = () => {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [editData, setEditData] = useState({ name: '', bio: '', resume_url: '' });
  const [selectedSkillIds, setSelectedSkillIds] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await apiGet(`/api/profile/${user.user_id}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setSkills(data.skills || []);
        setEditData({ name: data.name, bio: data.bio || '', resume_url: data.resume_url || '' });
        setSelectedSkillIds((data.skills || []).map(s => s.id));
      }
    } catch (err) {
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user.user_id]);

  const saveProfile = async () => {
    try {
      const res = await apiPut(`/api/profile/${user.user_id}`, {
        ...editData,
        linkedin_url: '', github_url: '', twitter_url: ''
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        login({...user, name: editData.name}, localStorage.getItem('token'));
        fetchProfile();
      }
    } catch (err) {
      alert('Failed to update profile.');
    }
  };

  const openSkillsModal = async () => {
    setIsSkillsModalOpen(true);
    try {
      const res = await apiGet('/api/skills');
      if (res.ok) setAllSkills(await res.json());
    } catch (err) {
      console.error('Failed to load skills');
    }
  };

  const saveSkills = async () => {
    const names = allSkills.filter(s => selectedSkillIds.includes(s.id)).map(s => s.name);
    try {
      const res = await apiPost(`/api/user/skills/${user.user_id}`, { skill_names: names });
      if (res.ok) {
        setIsSkillsModalOpen(false);
        fetchProfile();
      }
    } catch (err) {
      alert('Failed to save skills.');
    }
  };

  return (
    <div className="light-theme">
      <main className="container" style={{ paddingTop: '100px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }} onClick={() => setIsEditModalOpen(true)}>
            <i className="fas fa-user-edit" style={{ marginRight: '8px' }}></i> Edit Your Profile
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '28px', alignItems: 'start' }}>
          <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg,#6366F1,#A855F7)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '2rem', color: 'white', fontWeight: 800 }}>
              {profile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <h2 style={{ marginBottom: '4px', fontSize: '1.2rem' }}>{profile?.name}</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px' }}>{profile?.email}</p>
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '10px', letterSpacing: '0.05em' }}>Resume</p>
              {profile?.resume_url ? (
                <a href={profile.resume_url} target="_blank" rel="noopener" style={{ display: 'inline-block', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, background: '#ECFDF5', color: '#059669' }}>
                  <i className="fas fa-file-pdf" style={{ marginRight: '6px' }}></i> View Resume
                </a>
              ) : (
                <span style={{ display: 'inline-block', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, background: '#f1f5f9', color: '#94a3b8' }}>
                  <i className="fas fa-file-pdf" style={{ marginRight: '6px' }}></i> No Resume Yet
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card">
              <div className="card-header"><h2>About Me</h2></div>
              <div style={{ padding: '24px 32px' }}>
                <p style={{ color: '#64748b', lineHeight: 1.7 }}>{profile?.bio || 'No bio yet. Click "Edit Your Profile" to add one!'}</p>
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <h2>Professional Skills</h2>
                <button onClick={openSkillsModal} style={{ padding: '8px 16px', fontSize: '0.85rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                  <i className="fas fa-plus" style={{ marginRight: '6px' }}></i>Manage Skills
                </button>
              </div>
              <div style={{ padding: '24px 32px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {skills.length > 0 ? (
                  skills.map(s => <span key={s.id} style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>{s.name}</span>)
                ) : (
                  <p style={{ color: '#94a3b8' }}>No skills added yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {isEditModalOpen && (
        <div className="modal-overlay active">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Full Name</label>
              <input type="text" className="input-control" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea className="input-control" rows="4" value={editData.bio} onChange={(e) => setEditData({...editData, bio: e.target.value})}></textarea>
            </div>
            <div className="form-group">
              <label>Resume URL</label>
              <input type="url" className="input-control" value={editData.resume_url} onChange={(e) => setEditData({...editData, resume_url: e.target.value})} />
            </div>
            <div className="modal-actions">
              <button className="logout-btn" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveProfile}>Save Profile</button>
            </div>
          </div>
        </div>
      )}

      {isSkillsModalOpen && (
        <div className="modal-overlay active">
          <div className="modal" style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h2>Manage Skills</h2>
              <button className="close-btn" onClick={() => setIsSkillsModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', margin: '16px 0 8px' }}>Your Skills</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px', marginBottom: '20px' }}>
              {allSkills.filter(s => selectedSkillIds.includes(s.id)).map(skill => (
                <span key={skill.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#6366F1', color: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600 }}>
                  {skill.name}
                  <span onClick={() => setSelectedSkillIds(ids => ids.filter(id => id !== skill.id))} style={{ cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '18px', height: '18px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', marginLeft: '4px' }}>
                    <i className="fas fa-times" style={{ fontSize: '0.65rem' }}></i>
                  </span>
                </span>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px' }}>Add a Skill</p>
            <div style={{ position: 'relative' }}>
              <input type="text" className="input-control" placeholder="Search skills..." value={skillSearch} onChange={(e) => setSkillSearch(e.target.value)} />
              {skillSearch && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', maxHeight: '200px', overflowY: 'auto', zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                  {allSkills.filter(s => !selectedSkillIds.includes(s.id) && s.name.toLowerCase().includes(skillSearch.toLowerCase())).map(skill => (
                    <div key={skill.id} style={{ padding: '10px 14px', cursor: 'pointer' }} onClick={() => { setSelectedSkillIds([...selectedSkillIds, skill.id]); setSkillSearch(''); }}>{skill.name}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="logout-btn" onClick={() => setIsSkillsModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveSkills}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
