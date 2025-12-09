// src/App.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Calendar, CheckCircle, XCircle, Clock, User,
  Users, LogOut, ChevronRight, AlertCircle, BookOpen,
  Shield, Check, X, Grid, Info, UserPlus, Loader
} from 'lucide-react';
import './App.css';

// --- CONFIGURATION ---
const API_URL = 'http://localhost:5000/api';

// --- UTILITIES ---
const getDayName = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

// The "Smart" Engine (Runs on client side using data fetched from DB)
const findAvailableSubstitutes = (dateStr, slot, originalUserId, allUsers, timetable, leaves) => {
  const dayName = getDayName(dateStr);

  const usersOnLeave = (leaves || [])
    .filter(l => l.date === dateStr && (l.status === 'Pending' || l.status === 'Approved'))
    .map(l => String(l.userId));

  const candidates = (allUsers || []).filter(u =>
    String(u._id) !== String(originalUserId) &&
    !usersOnLeave.includes(String(u._id))
  );

  const available = candidates.filter(candidate => {
    const hasClass = (timetable || []).find(t =>
      String(t.userId) === String(candidate._id) &&
      t.day === dayName &&
      Number(t.slot) === Number(slot)
    );
    return !hasClass;
  });

  return available;
};

// --- COMPONENTS ---

const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'success' && <CheckCircle size={20} />}
            {toast.type === 'error' && <AlertCircle size={20} />}
            {toast.type === 'info' && <Info size={20} />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => removeToast(toast.id)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}>
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

const TimetableView = ({ user, timetable }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const slots = [
    { id: 1, time: '09:00 - 10:00' },
    { id: 2, time: '10:00 - 11:00' },
    { id: 3, time: '11:00 - 12:00' },
    { id: 4, time: '01:00 - 02:00' },
  ];

  const getSchedule = (day, slotId) => {
    return timetable.find(t => String(t.userId) === String(user._id) && t.day === day && Number(t.slot) === Number(slotId));
  };

  return (
    <div className="card">
      <div className="p-6" style={{ borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>My Weekly Timetable</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Academic Year 2023-2024 • Semester I</p>
        </div>
        <div style={{ background: '#dbeafe', color: '#1e40af', padding: '0.5rem', borderRadius: '0.5rem' }}>
          <Grid size={24} />
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '120px' }}>Day</th>
              {slots.map(slot => (
                <th key={slot.id} style={{ borderLeft: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--text-dark)' }}>Slot {slot.id}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>{slot.time}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <tr key={day}>
                <td style={{ fontWeight: 'bold', background: '#f8fafc' }}>{day}</td>
                {slots.map(slot => {
                  const schedule = getSchedule(day, slot.id);
                  return (
                    <td key={slot.id} className="tt-cell">
                      {schedule ? (
                        <div className="tt-class" style={{
                          backgroundColor: schedule.subject.startsWith('Sub:') ? '#ecfdf5' : '#eff6ff',
                          borderColor: schedule.subject.startsWith('Sub:') ? '#d1fae5' : '#dbeafe'
                        }}>
                          <div style={{
                            fontWeight: 'bold',
                            color: schedule.subject.startsWith('Sub:') ? '#047857' : '#1e40af',
                            fontSize: '0.875rem'
                          }}>
                            {schedule.subject}
                          </div>
                          <div style={{ marginTop: '0.25rem' }}>
                            <span style={{
                              background: schedule.subject.startsWith('Sub:') ? '#d1fae5' : '#dbeafe',
                              color: schedule.subject.startsWith('Sub:') ? '#047857' : '#1e40af',
                              padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '500'
                            }}>
                              {schedule.class}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.75rem' }}>
                          Free
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Login = ({ onLogin, addToast }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password: pass });

      // Store token and call parent handler
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
    } catch (err) {
      setError(err.response?.data?.msg || 'Login failed');
      addToast(err.response?.data?.msg || 'Login failed', 'error');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="login-page">
      <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '50%' }}>
            <BookOpen color="white" size={32} />
          </div>
        </div>
        <h2 className="text-center font-bold" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Faculty Portal</h2>
        <p className="text-center" style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Smart Leave & Substitution Management</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="e.g., james@uni.edu"
              disabled={isLoggingIn}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem' }}>Password</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="input-field"
              placeholder="Password"
              disabled={isLoggingIn}
            />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}
          <button type="submit" className="btn btn-primary w-full" disabled={isLoggingIn}>
            {isLoggingIn ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  let badgeClass = 'badge-pending';
  let Icon = Clock;

  if (status === 'Approved') { badgeClass = 'badge-approved'; Icon = CheckCircle; }
  else if (status === 'Rejected') { badgeClass = 'badge-rejected'; Icon = XCircle; }
  else if (status === 'Accepted') { badgeClass = 'badge-accepted'; Icon = CheckCircle; }

  return (
    <span className={`badge ${badgeClass}`}>
      <Icon size={12} style={{ marginRight: '4px' }} />
      {status}
    </span>
  );
};

// ForceAssignSelector — shows only truly available faculty for the given leave date + slot
const ForceAssignSelector = ({ slot, leaveDate, allUsers, timetable, leaves, requesterId, onForceAssign }) => {
  const [selectedId, setSelectedId] = useState('');

  // compute available faculty for the given day & slot
  const availableFaculty = useMemo(() => {
    if (!leaveDate) return [];

    // 1) users who are on leave that day (Pending or Approved)
    const usersOnLeave = (leaves || [])
      .filter(l => l.date === leaveDate && (l.status === 'Pending' || l.status === 'Approved'))
      .map(l => String(l.userId));

    // 2) day name
    let dayName = null;
    try {
      dayName = new Date(leaveDate).toLocaleDateString('en-US', { weekday: 'long' });
    } catch (e) {
      dayName = null;
    }
    if (!dayName) return [];

    // 3) filter allUsers: exclude requester, users on leave, and those who already have a class in that slot/day
    return (allUsers || []).filter(u => {
      if (!u || !u._id) return false;
      if (String(u._id) === String(requesterId)) return false;
      if (usersOnLeave.includes(String(u._id))) return false;

      // check timetable for conflicts
      const hasClass = (timetable || []).some(t =>
        String(t.userId) === String(u._id) &&
        t.day === dayName &&
        Number(t.slot) === Number(slot)
      );
      return !hasClass;
    });
  }, [slot, leaveDate, allUsers, timetable, leaves, requesterId]);

  return (
    <div className="flex gap-2 items-center mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
      <UserPlus size={16} className="text-yellow-700" />
      <select className="text-xs p-1 border rounded" value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
        <option value="">-- Select Forced Substitute --</option>
        {availableFaculty.map(u => (
          <option key={u._id} value={u._1d}>{u.name} ({u.department || 'Dept'})</option>
        ))}
      </select>
      <button disabled={!selectedId} onClick={() => {
        const user = availableFaculty.find(u => u._id === selectedId);
        if (user) onForceAssign(slot, selectedId, user.name);
      }} className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 disabled:opacity-50">
        Force
      </button>
    </div>
  );
};

const LeaveApplicationForm = ({ user, allUsers, onClose, onSubmit, addToast, timetable, leaves }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: 'Casual',
    date: '',
    reason: '',
    substitutions: []
  });

  const classesOnDate = useMemo(() => {
    if (!formData.date) return [];
    const day = getDayName(formData.date);
    return (timetable || []).filter(t => String(t.userId) === String(user._id) && t.day === day);
  }, [formData.date, user._id, timetable]);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.date || !formData.reason) {
        addToast("Please fill all fields to proceed", "error");
        return;
      }
      const initialSubs = classesOnDate.map(cls => ({ ...cls, subId: '', subName: '' }));
      setFormData(prev => ({ ...prev, substitutions: initialSubs }));
      setStep(2);
    } else {
      if (formData.substitutions.some(s => !s.subId)) {
        addToast("Please assign a substitute for every class.", "error");
        return;
      }
      onSubmit(formData);
    }
  };

  const updateSubstitute = (slot, subId, subName) => {
    setFormData(prev => ({
      ...prev,
      substitutions: prev.substitutions.map(s =>
        Number(s.slot) === Number(slot) ? { ...s, subId, subName } : s
      )
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ background: 'var(--primary)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Apply for Leave</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Leave Type</label>
                  <select className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                    <option>Casual</option>
                    <option>Sick</option>
                    <option>Personal</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Date</label>
                  <input type="date" className="input-field" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Reason</label>
                <textarea className="input-field" style={{ height: '100px', fontFamily: 'inherit' }} placeholder="Why do you need this leave?" value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} />
              </div>

              {formData.date && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Classes on {getDayName(formData.date)}:</h4>
                  {classesOnDate.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                      {classesOnDate.map(c => (
                        <li key={c.slot} style={{ marginBottom: '0.25rem' }}>
                          <span style={{ fontFamily: 'monospace', background: '#e2e8f0', padding: '0 4px', borderRadius: '4px', marginRight: '8px' }}>Slot {c.slot}</span>
                          {c.subject} ({c.class})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--success)', margin: 0 }}>No classes found. You can apply without substitutes.</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', padding: '1rem', borderRadius: '0.5rem' }}>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e40af', fontSize: '0.875rem' }}>Smart Substitution</h4>
                <p style={{ margin: 0, color: '#1d4ed8', fontSize: '0.75rem' }}>The system has analyzed the master timetable to find faculty members who are free during your class slots.</p>
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {formData.substitutions.map((subReq) => {
                  const availableFaculty = findAvailableSubstitutes(formData.date, subReq.slot, user._id, allUsers, timetable, leaves);

                  return (
                    <div key={subReq.slot} style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-sm">Slot {subReq.slot}: {subReq.subject} ({subReq.class})</span>
                        {subReq.subName ? (
                          <span className="badge badge-approved">
                            <Check size={12} style={{ marginRight: '4px' }} /> Selected: {subReq.subName}
                          </span>
                        ) : (
                          <span className="badge badge-rejected">Required</span>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {availableFaculty.map(f => (
                          <button key={f._id} onClick={() => updateSubstitute(subReq.slot, f._id, f.name)} style={{
                            textAlign: 'left',
                            padding: '0.5rem',
                            borderRadius: '0.25rem',
                            border: subReq.subId === f._id ? '1px solid var(--primary)' : '1px solid var(--border)',
                            background: subReq.subId === f._id ? 'var(--primary)' : 'white',
                            color: subReq.subId === f._id ? 'white' : 'inherit',
                            cursor: 'pointer'
                          }}>
                            <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{f.name}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{f.department}</div>
                          </button>
                        ))}
                        {availableFaculty.length === 0 && (
                          <div style={{ gridColumn: 'span 2', fontSize: '0.75rem', color: 'var(--danger)', fontStyle: 'italic' }}>No free faculty found. Contact Admin.</div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {formData.substitutions.length === 0 && (
                  <p className="text-center text-muted">No classes to substitute on this day.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div style={{ background: '#f8fafc', padding: '1rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
          {step === 2 && (
            <button onClick={() => setStep(1)} className="btn btn-outline">Back</button>
          )}
          <button onClick={handleNext} className="btn btn-primary" style={{ marginLeft: 'auto' }}>
            {step === 1 ? (classesOnDate.length > 0 ? 'Next: Find Substitutes' : 'Submit Application') : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- FacultyOverview (right-side panel) ----------
const FacultyOverview = ({ allUsers = [], leaves = [], timetable = [] }) => {
  const todayISO = new Date().toISOString().slice(0, 10);

  const usersWithSummary = (allUsers || []).map(u => {
    const id = String(u._id);
    const casual = u.leaveBalance?.casual ?? 0;
    const sick = u.leaveBalance?.sick ?? 0;
    const personal = u.leaveBalance?.personal ?? 0;
    const onLeaveToday = (leaves || []).some(l => String(l.userId) === id && l.date === todayISO && (l.status === 'Approved' || l.status === 'Pending'));
    return { id, name: u.name, email: u.email, department: u.department, casual, sick, personal, onLeaveToday };
  });

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ marginTop: 0 }}>Faculty Overview</h3>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Today: {todayISO}</div>

      <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {usersWithSummary.length === 0 && <div className="text-muted">No faculty found.</div>}
        {usersWithSummary.map(u => (
          <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontWeight: '600' }}>{u.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.department} • {u.email}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem' }}>Casual: <b>{u.casual}</b></div>
              <div style={{ fontSize: '0.85rem' }}>Sick: <b>{u.sick}</b></div>
              <div style={{ fontSize: '0.85rem' }}>Personal: <b>{u.personal}</b></div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: u.onLeaveToday ? '#b91c1c' : '#059669' }}>
                {u.onLeaveToday ? 'On leave today' : 'Present'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- Updated Dashboard ----------
const Dashboard = ({ user, allUsers = [], leaves = [], timetable = [], onLogout, onRequestLeave, onApproveLeave, onAcceptSubRequest, onForceAssign, addToast, currentView, setCurrentView }) => {
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [localView, setLocalView] = useState(currentView || 'dashboard');

  useEffect(() => setLocalView(currentView || 'dashboard'), [currentView]);

  // ensure incomingSubRequests are filtered correctly (string comparisons)
  const incomingSubRequests = (leaves || []).flatMap(l => {
    const leaveId = l._id;
    const leaveDate = l.date;
    const requester = l.userName || '';
    return (l.substitutions || [])
      .filter(s => String(s.subId) === String(user._id) && String(s.status) === 'Pending')
      .map(s => ({ leaveId, leaveDate, requester, slot: s.slot, className: s.class, subject: s.subject }));
  });

  const myLeaves = (leaves || []).filter(l => String(l.userId) === String(user._id));
  const pendingApprovals = (user.role === 'HOD' || user.role === 'Admin') ? (leaves || []).filter(l => l.status === 'Pending') : [];

  // secure switchView: only allow 'faculty' for HOD/Admin
  const switchView = (v) => {
    if (v === 'faculty' && !(user.role === 'HOD' || user.role === 'Admin')) {
      // prevent non-admins from opening faculty view
      if (typeof addToast === 'function') addToast('Not authorized to view faculty overview', 'error');
      setLocalView('dashboard');
      if (typeof setCurrentView === 'function') setCurrentView('dashboard');
      return;
    }
    setLocalView(v);
    if (typeof setCurrentView === 'function') setCurrentView(v);
  };

  return (
    <div className="app-layout" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar (left) */}
      <div className="sidebar" style={{ width: 260, flexShrink: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #1e293b' }}>
          <h1 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}>
            <Shield style={{ marginRight: '0.5rem', color: 'var(--primary)' }} /> UniAdmin
          </h1>
        </div>

        <div style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#1e293b', borderRadius: '0.5rem', marginBottom: '1.5rem', color: 'white' }}>
            <User style={{ marginRight: '0.75rem' }} size={20} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user.role}</div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>Menu</div>

          <button onClick={() => switchView('dashboard')} className={`sidebar-item ${localView === 'dashboard' ? 'active' : ''}`}>
            <BookOpen size={18} style={{ marginRight: '0.75rem' }} /> Dashboard
          </button>

          <button onClick={() => switchView('timetable')} className={`sidebar-item ${localView === 'timetable' ? 'active' : ''}`}>
            <Calendar size={18} style={{ marginRight: '0.75rem' }} /> Timetable
          </button>

          {(user.role === 'HOD' || user.role === 'Admin') && (
            <button onClick={() => switchView('faculty')} className={`sidebar-item ${localView === 'faculty' ? 'active' : ''}`}>
              <Users size={18} style={{ marginRight: '0.75rem' }} /> Faculty Overview
            </button>
          )}
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid #1e293b' }}>
          <button onClick={onLogout} className="sidebar-item" style={{ color: '#f87171' }}>
            <LogOut size={18} style={{ marginRight: '0.75rem' }} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Area (center) */}
      <div style={{ flex: 1, padding: '1.25rem', minWidth: 0 }}>
        {localView === 'timetable' ? (
          <TimetableView user={user} timetable={timetable} />
        ) : (
          <>
            <div className="dashboard-grid">
              <div className="card p-4">
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Casual Leave</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{user.leaveBalance?.casual ?? 0}</div>
              </div>

              <div className="card p-4">
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Sick Leave</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{user.leaveBalance?.sick ?? 0}</div>
              </div>

              <div className="card p-4">
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Department</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--primary)' }}>{user.department}</div>
              </div>

              <button onClick={() => setShowLeaveForm(true)} className="btn btn-primary" style={{ height: '100%', flexDirection: 'column', padding: '1rem' }}>
                <span style={{ fontSize: '1.25rem' }}>+ Apply Leave</span>
              </button>
            </div>

            {(user.role === 'HOD' || user.role === 'Admin') && (
              <div className="card mb-4" style={{ marginTop: '1rem' }}>
                <div className="p-4" style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <h3 style={{ margin: 0, fontWeight: 'bold' }}>Leave Requests</h3>
                </div>

                <div style={{ padding: '1rem' }}>
                  {pendingApprovals.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)' }}>No leave requests pending approval.</div>
                  ) : (
                    pendingApprovals.map(l => (
                      <div key={l._id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: '600' }}>{l.userName}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{l.date} • {l.type}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => onApproveLeave(l._id, 'Rejected')} className="btn btn-outline">Reject</button>
                          <button onClick={() => onApproveLeave(l._id, 'Approved')} className="btn btn-primary">Approve</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="card mb-4">
              <div className="p-4" style={{ background: '#fff7ed', borderBottom: '1px solid #ffedd5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#9a3412', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                  <AlertCircle size={18} style={{ marginRight: '0.5rem' }} /> Substitution Requests
                </h3>
                <span className="badge" style={{ background: '#fed7aa', color: '#9a3412' }}>{incomingSubRequests.length} Pending</span>
              </div>

              <div>
                {incomingSubRequests.length === 0 ? (
                  <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No substitution requests pending for you.</div>
                ) : incomingSubRequests.map((req, idx) => (
                  <div key={idx} className="p-4" style={{ borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div>
                      <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>Substitute for {req.requester}</p>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                        <span className="flex items-center"><Calendar size={14} style={{ marginRight: '4px' }} /> {req.leaveDate}</span>
                        <span className="flex items-center"><Clock size={14} style={{ marginRight: '4px' }} /> Slot {req.slot}</span>
                        <span className="flex items-center"><BookOpen size={14} style={{ marginRight: '4px' }} /> {req.className}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => onAcceptSubRequest(req.leaveId, req.slot, false)} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Decline</button>
                      <button onClick={() => onAcceptSubRequest(req.leaveId, req.slot, true)} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>Accept</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ margin: 0, fontWeight: 'bold' }}>My Leave History</h3>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Reason</th>
                      <th>Subs Status</th>
                      <th>Admin Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLeaves.map(l => {
                      const allSubsAccepted = (l.substitutions || []).every(s => s.status === 'Accepted');
                      const pendingSubs = (l.substitutions || []).filter(s => s.status === 'Pending');
                      const rejectedSubs = (l.substitutions || []).filter(s => s.status === 'Rejected');

                      return (
                        <tr key={l._id}>
                          <td style={{ fontWeight: '500' }}>{l.type}</td>
                          <td>{l.date}</td>
                          <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{l.reason}</td>
                          <td>
                            {(l.substitutions || []).length === 0 ? (
                              <span style={{ color: '#cbd5e1' }}>-</span>
                            ) : (
                              <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {pendingSubs.length > 0 && <span style={{ color: 'var(--warning)', fontWeight: '500' }}>Awaiting: {pendingSubs.map(s => s.subName?.split(' ').slice(-1)).join(', ')}</span>}
                                {rejectedSubs.length > 0 && <span style={{ color: 'var(--danger)', fontWeight: '500' }}>Rejected by: {rejectedSubs.map(s => s.subName?.split(' ').slice(-1)).join(', ')}</span>}
                                {allSubsAccepted && <span style={{ color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}><Check size={12} style={{ marginRight: '2px' }} /> All Ready</span>}
                              </div>
                            )}
                          </td>
                          <td><StatusBadge status={l.status} /></td>
                        </tr>
                      );
                    })}
                    {myLeaves.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No leave history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* RIGHT SIDE PANEL: only rendered when admin/HOD clicked Faculty Overview */}
      {localView === 'faculty' && (user.role === 'HOD' || user.role === 'Admin') && (
        <div style={{ width: 360, flexShrink: 0, borderLeft: '1px solid var(--border)', background: '#ffffff' }}>
          <FacultyOverview allUsers={allUsers} leaves={leaves} timetable={timetable} />
        </div>
      )}

      {/* Leave Application Modal */}
      {showLeaveForm && (
        <LeaveApplicationForm
          user={user}
          allUsers={allUsers}
          onClose={() => setShowLeaveForm(false)}
          onSubmit={(data) => { onRequestLeave(data); setShowLeaveForm(false); }}
          addToast={addToast}
          timetable={timetable}
          leaves={leaves}
        />
      )}
    </div>
  );
};

// --- MAIN APP ORCHESTRATOR ---

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]); // Loaded from DB
  const [leaves, setLeaves] = useState([]); // Loaded from DB
  const [timetable, setTimetable] = useState([]); // Loaded from DB
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // New state for full screen loader
  const [currentView, setCurrentView] = useState('dashboard');

  // Fetch initial data on mount or login
  const fetchDashboardData = useCallback(async (showLoader = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (showLoader) setIsLoading(true);

    try {
      const config = { headers: { 'x-auth-token': token } };

      const [leavesRes, timetableRes, usersRes] = await Promise.all([
        axios.get(`${API_URL}/data/leaves`, config),
        axios.get(`${API_URL}/data/timetable`, config),
        axios.get(`${API_URL}/data/users`, config)
      ]);

      setLeaves(leavesRes.data || []);
      setTimetable(timetableRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.error("Error fetching dashboard data", err);
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        setCurrentUser(null);
      }
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, []);

  // Check for existing token on load (cold start)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      (async () => {
        try {
          const res = await axios.get(`${API_URL}/auth/me`, { headers: { 'x-auth-token': token } });
          setCurrentUser(res.data);
          await fetchDashboardData(true);
        } catch (e) {
          localStorage.removeItem('token');
          setCurrentUser(null);
        }
      })();
    }
  }, [fetchDashboardData]);

  // robust login success handler — fetch authoritative user and dashboard data
  const handleLoginSuccess = async (userPayload) => {
    setIsLoading(true);

    try {
      await fetchDashboardData(true);

      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await axios.get(`${API_URL}/auth/me`, { headers: { 'x-auth-token': token } });
          setCurrentUser(res.data);
        } catch (err) {
          console.warn('Failed to fetch /auth/me after login, using optimistic payload.', err);
          setCurrentUser(userPayload);
        }
      } else {
        setCurrentUser(userPayload);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const handleRequestLeave = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };

      const res = await axios.post(`${API_URL}/data/leaves`, formData, config);

      setLeaves(prev => [res.data, ...prev]);
      addToast("Leave request submitted! Substitutes have been notified.", "success");
    } catch (err) {
      const errorMsg = err.response?.data?.msg || "Failed to submit leave request.";
      addToast(errorMsg, "error");
    }
  };

  const handleAcceptSubRequest = async (leaveId, slot, isAccepted) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };

      await axios.patch(`${API_URL}/data/leaves/${leaveId}/substitute`,
        { slot, status: isAccepted ? 'Accepted' : 'Rejected' },
        config
      );

      await fetchDashboardData(false);
      addToast(isAccepted ? "Substitution accepted." : "Substitution declined.", isAccepted ? "success" : "info");
    } catch (err) {
      addToast("Error processing request.", "error");
    }
  };

  const handleForceAssign = async (leaveId, slot, subId, subName) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };

      await axios.patch(`${API_URL}/data/leaves/${leaveId}/force-substitute`,
        { slot, subId, subName },
        config
      );

      await fetchDashboardData(false);
      addToast("Substitute force assigned successfully.", "success");
    } catch (err) {
      addToast("Error force assigning substitute.", "error");
    }
  };

  const handleApproveLeave = async (leaveId, status) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };

      await axios.patch(`${API_URL}/data/leaves/${leaveId}/status`, { status }, config);

      await fetchDashboardData(false);
      addToast(`Leave request ${status.toLowerCase()}.`, status === 'Approved' ? "success" : "info");
    } catch (err) {
      addToast("Error updating status.", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setLeaves([]);
    setTimetable([]);
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {currentUser ? (
        isLoading ? (
          <div className="flex items-center justify-center h-screen bg-slate-50 w-full">
            <div className="text-center">
              <div className="animate-spin mb-4 text-blue-600 flex justify-center">
                <Loader size={48} />
              </div>
              <p className="text-slate-500 font-medium">Loading Dashboard...</p>
            </div>
          </div>
        ) : (
          <Dashboard
            user={currentUser}
            allUsers={users}
            leaves={leaves}
            timetable={timetable}
            onLogout={handleLogout}
            onRequestLeave={handleRequestLeave}
            onApproveLeave={handleApproveLeave}
            onAcceptSubRequest={handleAcceptSubRequest}
            onForceAssign={handleForceAssign}
            addToast={addToast}
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
        )
      ) : (
        <Login onLogin={handleLoginSuccess} addToast={addToast} />
      )}
    </>
  );
};

export default App;
