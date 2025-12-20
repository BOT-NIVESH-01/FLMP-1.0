import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  Calendar, CheckCircle, XCircle, Clock, User,
  Users, LogOut, ChevronRight, AlertCircle, BookOpen,
  Shield, Check, X, Grid, Info, UserPlus, Loader, Eye, EyeOff, Coffee
} from 'lucide-react';
import './App.css'; 

// --- CONFIGURATION ---
const API_URL = 'http://localhost:5000/api';

// --- UTILITIES ---
const getDayName = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  const currDate = new Date(startDate);
  const lastDate = new Date(endDate);
  
  while (currDate <= lastDate) {
    dates.push(new Date(currDate).toISOString().split('T')[0]);
    currDate.setDate(currDate.getDate() + 1);
  }
  return dates;
};

// The "Smart" Engine (Runs on client side using data fetched from DB)
const findAvailableSubstitutes = (dateStr, slot, originalUserId, allUsers, timetable, leaves) => {
  const dayName = getDayName(dateStr);

  const usersOnLeave = leaves
    .filter(l => l.date === dateStr && (l.status === 'Pending' || l.status === 'Approved'))
    .map(l => l.userId);

  const candidates = allUsers.filter(u => 
    u._id !== originalUserId && 
    !usersOnLeave.includes(u._id)
  );

  const available = candidates.filter(candidate => {
    const hasClass = timetable.find(t =>
      t.userId === candidate._id &&
      t.day === dayName &&
      t.slot === slot
    );
    return !hasClass;
  });

  return available;
};

// --- COMPONENTS ---

const ToastContainer = ({ toasts, removeToast }) => {
  if (toasts.length === 0) return null;
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
          <button 
            onClick={() => removeToast(toast.id)} 
            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.8 }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

const TimetableView = ({ user, timetable }) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Define Teaching Slots
  const slots = [
    { id: 1, time: '08:00 - 08:50' },
    { id: 2, time: '09:10 - 10:00' },
    { id: 3, time: '10:00 - 10:50' },
    { id: 4, time: '11:10 - 12:00' },
    { id: 5, time: '12:00 - 12:50' },
    { id: 6, time: '01:40 - 02:30' },
    { id: 7, time: '02:30 - 03:20' },
    { id: 8, time: '03:20 - 04:10' },
  ];

  const getSchedule = (day, slotId) => {
    return timetable.find(t => t.userId === user._id && t.day === day && t.slot === slotId);
  };

  // Helper to render a class cell
  const renderCell = (day, slot) => {
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
              fontSize: '0.75rem' 
            }}>
              {schedule.subject}
            </div>
            <div style={{ marginTop: '0.25rem' }}>
                <span style={{ 
                  background: schedule.subject.startsWith('Sub:') ? '#d1fae5' : '#dbeafe', 
                  color: schedule.subject.startsWith('Sub:') ? '#047857' : '#1e40af', 
                  padding: '1px 4px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: '500' 
                }}>
                  {schedule.class}
                </span>
            </div>
          </div>
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0', fontSize: '0.75rem' }}>
            -
          </div>
        )}
      </td>
    );
  };

  // Helper to render break cell
  const renderBreak = (label) => (
    <td className="tt-cell bg-slate-100 border-l border-slate-200" style={{ width: '40px', verticalAlign: 'middle', padding: 0 }}>
      <div style={{ writingMode: 'vertical-lr', margin: '0 auto', fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {label}
      </div>
    </td>
  );

  return (
    <div className="card">
      <div className="p-6" style={{ borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>My Weekly Timetable</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Academic Year 2023-2024</p>
        </div>
        <div style={{ background: '#dbeafe', color: '#1e40af', padding: '0.5rem', borderRadius: '0.5rem' }}>
          <Grid size={24} />
        </div>
      </div>

      <div className="table-container">
        <table className="table" style={{ fontSize: '0.75rem' }}>
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Day</th>
              <th style={{ borderLeft: '1px solid var(--border)' }}><div>Slot 1</div><div style={{fontSize:'0.65rem', fontWeight:'normal'}}>08:00-08:50</div></th>
              <th className="bg-slate-50 text-slate-400 text-[0.65rem] text-center px-1">Break</th>
              <th style={{ borderLeft: '1px solid var(--border)' }}><div>Slot 2</div><div style={{fontSize:'0.65rem', fontWeight:'normal'}}>09:10-10:00</div></th>
              <th style={{ borderLeft: '1px solid var(--border)' }}><div>Slot 3</div><div style={{fontSize:'0.65rem', fontWeight:'normal'}}>10:00-10:50</div></th>
              <th className="bg-slate-50 text-slate-400 text-[0.65rem] text-center px-1">Break</th>
              <th style={{ borderLeft: '1px solid var(--border)' }}><div>Slot 4</div><div style={{fontSize:'0.65rem', fontWeight:'normal'}}>11:10-12:00</div></th>
              <th style={{ borderLeft: '1px solid var(--border)' }}><div>Slot 5</div><div style={{fontSize:'0.65rem', fontWeight:'normal'}}>12:00-12:50</div></th>
              <th className="bg-slate-50 text-slate-400 text-[0.65rem] text-center px-1">Lunch</th>
              <th style={{ borderLeft: '1px solid var(--border)' }}><div>Slot 6</div><div style={{fontSize:'0.65rem', fontWeight:'normal'}}>01:40-02:30</div></th>
              <th style={{ borderLeft: '1px solid var(--border)' }}><div>Slot 7</div><div style={{fontSize:'0.65rem', fontWeight:'normal'}}>02:30-03:20</div></th>
              <th style={{ borderLeft: '1px solid var(--border)' }}><div>Slot 8</div><div style={{fontSize:'0.65rem', fontWeight:'normal'}}>03:20-04:10</div></th>
            </tr>
          </thead>
          <tbody>
            {days.map(day => (
              <tr key={day}>
                <td style={{ fontWeight: 'bold', background: '#f8fafc' }}>{day}</td>
                {renderCell(day, slots[0])}
                {renderBreak('Break')}
                {renderCell(day, slots[1])}
                {renderCell(day, slots[2])}
                {renderBreak('Break')}
                {renderCell(day, slots[3])}
                {renderCell(day, slots[4])}
                {renderBreak('Lunch')}
                {renderCell(day, slots[5])}
                {renderCell(day, slots[6])}
                {renderCell(day, slots[7])}
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

  if (status === 'Accepted') { badgeClass = 'badge-accepted'; Icon = CheckCircle; }
  else if (status === 'Approved') { badgeClass = 'badge-approved'; Icon = CheckCircle; }
  else if (status === 'Rejected') { badgeClass = 'badge-rejected'; Icon = XCircle; }

  return (
    <span className={`badge ${badgeClass}`}>
      <Icon size={12} style={{ marginRight: '4px' }} />
      {status}
    </span>
  );
};

// Component for Force Assign Selection
const ForceAssignSelector = ({ slot, allUsers, onForceAssign }) => {
  const [selectedId, setSelectedId] = useState('');

  return (
    <div className="flex gap-2 items-center mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
      <UserPlus size={16} className="text-yellow-700" />
      <select 
        className="text-xs p-1 border rounded flex-1"
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        <option value="">-- Select Forced Substitute --</option>
        {allUsers.map(u => (
          <option key={u._id} value={u._id}>{u.name} ({u.department})</option>
        ))}
      </select>
      <button 
        disabled={!selectedId}
        onClick={() => {
          const user = allUsers.find(u => u._id === selectedId);
          onForceAssign(slot, selectedId, user.name);
        }}
        className="px-3 py-1 bg-yellow-600 text-white text-xs font-semibold rounded hover:bg-yellow-700 disabled:opacity-50"
      >
        Force
      </button>
    </div>
  );
};

const FacultyOverview = ({ users, leaves }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const getStatus = (userId) => {
    const onLeave = leaves.find(l => l.userId === userId && l.date === today && (l.status === 'Approved' || l.status === 'Pending'));
    return onLeave ? { text: 'On Leave', class: 'badge-rejected' } : { text: 'Available', class: 'badge-approved' };
  };

  return (
    <div className="card">
      <div className="p-6" style={{ borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Faculty Overview (Today)</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Department</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const status = getStatus(u._id);
              return (
                <tr key={u._id}>
                  <td className="font-medium">{u.name}</td>
                  <td>{u.department}</td>
                  <td><span className={`badge ${status.class}`}>{status.text}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LeaveApplicationForm = ({ user, allUsers, onClose, onSubmit, addToast, timetable, leaves }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: 'Casual',
    date: '',
    endDate: '', // Added for Medical Leave
    reason: '',
    substitutions: [] 
  });

  // Calculate classes for the range
  const classesReqSubstitution = useMemo(() => {
    if (!formData.date) return [];
    
    let dates = [formData.date];
    if (formData.type === 'Medical' && formData.endDate) {
      dates = getDatesInRange(formData.date, formData.endDate);
    }

    const classes = [];
    dates.forEach(dateStr => {
      const dayName = getDayName(dateStr);
      const dailyClasses = timetable.filter(t => t.userId === user._id && t.day === dayName);
      dailyClasses.forEach(cls => {
        classes.push({ ...cls, date: dateStr, displayDate: dateStr });
      });
    });
    return classes;
  }, [formData.date, formData.endDate, formData.type, user._id, timetable]);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.date || !formData.reason) {
        addToast("Please fill all fields to proceed", "error");
        return;
      }

      if (formData.type === 'Medical') {
        if (!formData.endDate) {
          addToast("End Date is required for Medical Leave", "error");
          return;
        }
        const start = new Date(formData.date);
        const end = new Date(formData.endDate);
        const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays < 10) {
          addToast("Medical leave must be at least 10 days.", "error");
          return;
        }
      }

      // Prepare substitution requests
      const initialSubs = classesReqSubstitution.map(cls => ({
        ...cls,
        subId: '',
        subName: ''
      }));
      
      setFormData(prev => ({ ...prev, substitutions: initialSubs }));
      setStep(2);
    } else {
      // Step 2: Submission
      // Check for Medical leave exemption on missing subs (if any "No Faculty Available" exists)
      const hasMissingSubs = formData.substitutions.some(s => !s.subId);
      
      if (formData.type !== 'Medical' && hasMissingSubs) {
        addToast("Cannot submit: No substitutes available for some classes.", "error");
        return;
      }

      // Sanitize
      const finalData = {
        ...formData,
        substitutions: formData.substitutions.map(s => ({
          ...s,
          subId: s.subId || null,
          subName: s.subName || 'Unassigned'
        }))
      };

      onSubmit(finalData);
    }
  };

  const updateSubstitute = (date, slot, subId, subName) => {
    setFormData(prev => ({
      ...prev,
      substitutions: prev.substitutions.map(s =>
        (s.date === date && s.slot === slot) ? { ...s, subId, subName } : s
      )
    }));
  };

  // Group substitutions by date and then by SLOT for display
  const groupedSubs = useMemo(() => {
    const groups = {};
    formData.substitutions.forEach(sub => {
      const key = `${sub.date}-${sub.slot}`; // Grouping by unique slot occurrence
      if (!groups[key]) {
        groups[key] = {
           date: sub.date,
           slot: sub.slot,
           subject: sub.subject,
           class: sub.class,
           candidates: []
        };
      }
      groups[key].candidates.push(sub);
    });
    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date) || a.slot - b.slot);
  }, [formData.substitutions]);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: 'var(--primary)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem' }}>Apply for Leave</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6" style={{ overflowY: 'auto', flex: 1 }}>
          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Leave Type</label>
                  <select
                    className="input-field"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option>Casual</option>
                    <option>Medical</option>
                    <option>Personal</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Start Date</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>

              {formData.type === 'Medical' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>End Date (Min 10 days)</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Reason</label>
                <textarea
                  className="input-field"
                  style={{ height: '100px', fontFamily: 'inherit' }}
                  placeholder="Why do you need this leave?"
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              {classesReqSubstitution.length > 0 && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Classes requiring substitution:</h4>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    <li>Total slots: <strong>{classesReqSubstitution.length}</strong></li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: '#eff6ff', border: '1px solid #dbeafe', padding: '1rem', borderRadius: '0.5rem' }}>
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e40af', fontSize: '0.875rem' }}>Smart Substitution</h4>
                <p style={{ margin: 0, color: '#1d4ed8', fontSize: '0.75rem' }}>
                  Requests will be broadcast to <b>all available faculty</b> for each slot. First to accept gets the slot.
                </p>
                {formData.type === 'Medical' && (
                  <p style={{ margin: '0.5rem 0 0 0', color: '#047857', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    * Medical Leave: You may submit even if no faculty is currently available.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {groupedSubs.map((group, idx) => (
                  <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem', background: 'white' }}>
                    <div className="flex justify-between items-center mb-2" style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '0.5rem' }}>
                        <div>
                          <div className="font-bold text-sm">{group.date} • Slot {group.slot}</div>
                          <div className="text-xs text-muted">{group.subject} ({group.class})</div>
                        </div>
                        <span className="badge badge-pending">{group.candidates.length} Candidate(s)</span>
                    </div>
                    
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
                      <strong>Auto-selected Substitutes:</strong>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {group.candidates.map((sub, i) => (
                          <span key={i} style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '999px', border: '1px solid #cbd5e1' }}>
                             {sub.subName}
                          </span>
                        ))}
                      </div>
                      {group.candidates[0].subId === null && (
                         <span style={{ color: 'var(--danger)', fontStyle: 'italic' }}>No faculty available.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ background: '#f8fafc', padding: '1rem', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          {step === 2 && (
            <button onClick={() => setStep(1)} className="btn btn-outline">Back</button>
          )}
          <button onClick={handleNext} className="btn btn-primary" style={{ marginLeft: 'auto' }}>
            {step === 1 ? 'Next: Find Substitutes' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ user, allUsers, leaves, timetable, onLogout, onRequestLeave, onApproveLeave, onAcceptSubRequest, onForceAssign, addToast }) => {
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  const myLeaves = leaves.filter(l => l.userId === user._id);
  
  // FIX: Case insensitive check
  const isAdminOrHod = ['admin', 'hod'].includes(user.role?.toLowerCase());
  
  const pendingApprovals = isAdminOrHod
    ? leaves.filter(l => l.status === 'Pending')
    : [];

  const incomingSubRequests = leaves.flatMap(l => {
     const acceptedSlots = new Set();
     l.substitutions.forEach(s => {
        if (s.status === 'Accepted') {
           acceptedSlots.add(`${s.date}-${s.slot}`);
        }
     });

     return l.substitutions
      .filter(s => {
         if (s.subId !== user._id) return false;
         if (s.status !== 'Pending') return false;
         const slotKey = `${s.date}-${s.slot}`;
         if (acceptedSlots.has(slotKey)) return false;

         return true;
      })
      .map(s => ({ ...s, leaveId: l._id, leaveDate: l.date, requester: l.userName }));
  });

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #1e293b' }}>
          <h1 style={{ color: 'white', fontWeight: 'bold', fontSize: '1.25rem', display: 'flex', alignItems: 'center' }}>
            <Shield style={{ marginRight: '0.5rem', color: 'var(--primary)' }} /> UniAdmin
          </h1>
        </div>
        <div style={{ padding: '1rem', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', background: '#1e293b', borderRadius: '0.5rem', marginBottom: '1.5rem', color: 'white' }}>
            <User style={{ marginRight: '0.75rem' }} size={20} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{user.role}</div>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>Menu</div>

          <button
            onClick={() => setCurrentView('dashboard')}
            className={`sidebar-item ${currentView === 'dashboard' ? 'active' : ''}`}
          >
            <BookOpen size={18} style={{ marginRight: '0.75rem' }} /> Dashboard
          </button>

          <button
            onClick={() => setCurrentView('timetable')}
            className={`sidebar-item ${currentView === 'timetable' ? 'active' : ''}`}
          >
            <Calendar size={18} style={{ marginRight: '0.75rem' }} /> Timetable
          </button>

          {/* Integrated Faculty Overview for Admin/HOD */}
          {isAdminOrHod && (
            <button
              onClick={() => setCurrentView('faculty_overview')}
              className={`sidebar-item ${currentView === 'faculty_overview' ? 'active' : ''}`}
            >
              <Eye size={18} style={{ marginRight: '0.75rem' }} /> Faculty Overview
            </button>
          )}
        </div>
        <div style={{ padding: '1rem', borderTop: '1px solid #1e293b' }}>
          <button onClick={onLogout} className="sidebar-item" style={{ color: '#f87171' }}>
            <LogOut size={18} style={{ marginRight: '0.75rem' }} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div style={{ maxWidth: '100%', margin: '0 auto', width: '100%' }}>

          {currentView === 'timetable' ? (
            <TimetableView user={user} timetable={timetable} />
          ) : currentView === 'faculty_overview' ? (
            <FacultyOverview users={allUsers} leaves={leaves} />
          ) : (
            <>
              {/* Header Stats */}
              <div className="dashboard-grid">
                <div className="card p-4">
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Casual Leave</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{user.leaveBalance.casual} <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#cbd5e1' }}>/ 12</span></div>
                </div>
                <div className="card p-4">
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Medical Leave</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{user.leaveBalance.sick} <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: '#cbd5e1' }}>/ 10</span></div>
                </div>
                <div className="card p-4">
                  <div style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Department</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--primary)' }}>{user.department}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowLeaveForm(true)}
                    className="btn btn-primary"
                    style={{ flex: 1, flexDirection: 'column', padding: '1rem' }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>+ Apply Leave</span>
                  </button>
                </div>
              </div>

              {/* Substitution Requests */}
              {incomingSubRequests.length > 0 && (
                <div className="card mb-4">
                  <div className="p-4" style={{ background: '#fff7ed', borderBottom: '1px solid #ffedd5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#9a3412', display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                      <AlertCircle size={18} style={{ marginRight: '0.5rem' }} /> Substitution Requests
                    </h3>
                    <span className="badge" style={{ background: '#fed7aa', color: '#9a3412' }}>{incomingSubRequests.length} Pending</span>
                  </div>
                  <div>
                    {incomingSubRequests.map((req, idx) => (
                      <div key={idx} className="p-4" style={{ borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                          <p style={{ fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>Substitute for {req.requester}</p>
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                            <span className="flex items-center"><Calendar size={14} style={{ marginRight: '4px' }} /> {req.date || req.leaveDate}</span>
                            <span className="flex items-center"><Clock size={14} style={{ marginRight: '4px' }} /> Slot {req.slot}</span>
                            <span className="flex items-center"><BookOpen size={14} style={{ marginRight: '4px' }} /> {req.class}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => onAcceptSubRequest(req.leaveId, req.slot, false)}
                            className="btn btn-outline"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => onAcceptSubRequest(req.leaveId, req.slot, true)}
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HOD Area: Approvals (Table View) */}
              {isAdminOrHod && (
                <div className="card mb-4">
                  <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ margin: 0, fontWeight: 'bold' }}>Pending Leave Approvals</h3>
                  </div>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Faculty</th>
                          <th>Leave Details</th>
                          <th>Substitutions</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingApprovals.map(l => {
                          const groupedBySlot = {};
                          l.substitutions.forEach(s => {
                             const key = `${s.date}-${s.slot}`;
                             if (!groupedBySlot[key]) groupedBySlot[key] = { date: s.date, slot: s.slot, candidates: [], accepted: null };
                             groupedBySlot[key].candidates.push(s);
                             if (s.status === 'Accepted') groupedBySlot[key].accepted = s;
                          });

                          return (
                          <tr key={l._id}>
                            <td className="font-medium">{l.userName}</td>
                            <td>
                              <div className="text-sm font-bold text-slate-800">{l.type}</div>
                              <div className="text-xs text-muted">{l.date}</div>
                              <div className="text-xs text-muted max-w-xs truncate">{l.reason}</div>
                            </td>
                            <td>
                              {l.substitutions.length > 0 ? (
                                <ul className="space-y-2 text-sm">
                                  {Object.values(groupedBySlot).map((group, gIdx) => (
                                    <li key={gIdx} className="border-b border-slate-100 pb-1 last:border-0">
                                      <div className="flex items-center gap-2 mb-1">
                                         <span className="font-mono text-xs bg-slate-100 px-1 rounded">{group.date} (S{group.slot})</span>
                                         {group.accepted ? (
                                            <>
                                               <span className="font-medium text-green-700">{group.accepted.subName}</span>
                                               <StatusBadge status="Accepted" />
                                            </>
                                         ) : (
                                            <span className="text-xs text-muted italic">Candidates: {group.candidates.length}</span>
                                         )}
                                      </div>
                                      {!group.accepted && (
                                        <div className="mt-1">
                                           <ForceAssignSelector 
                                             slot={group.slot} 
                                             allUsers={findAvailableSubstitutes(group.date || l.date, group.slot, l.userId, allUsers, timetable, leaves)}
                                             onForceAssign={(slot, subId, subName) => onForceAssign(l._id, slot, subId, subName)}
                                           />
                                        </div>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              ) : <span className="text-slate-400 italic">None</span>}
                            </td>
                            <td>
                              <div className="flex flex-col gap-2">
                                <button onClick={() => onApproveLeave(l._id, 'Approved')} className="btn btn-primary text-xs py-1">Approve</button>
                                <button onClick={() => onApproveLeave(l._id, 'Rejected')} className="btn btn-outline text-xs py-1 text-red-600 border-red-200 hover:bg-red-50">Reject</button>
                              </div>
                            </td>
                          </tr>
                        )})}
                        {pendingApprovals.length === 0 && (
                           <tr><td colSpan="4" className="text-center p-4 text-slate-500">No pending approvals.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* My Leave History */}
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
                        const uniqueSlots = {};
                        l.substitutions.forEach(s => {
                           const key = `${s.date || l.date}-${s.slot}`;
                           if (!uniqueSlots[key]) {
                             uniqueSlots[key] = {
                               date: s.date || l.date,
                               slot: s.slot,
                               accepted: null,
                               pendingCount: 0
                             };
                           }
                           if (s.status === 'Accepted') {
                             uniqueSlots[key].accepted = s.subName;
                           } else if (s.status === 'Pending') {
                             uniqueSlots[key].pendingCount++;
                           }
                        });
                        const slotList = Object.values(uniqueSlots).sort((a,b) => a.slot - b.slot);

                        return (
                          <tr key={l._id}>
                            <td style={{ fontWeight: '500' }}>{l.type}</td>
                            <td>{l.date}</td>
                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{l.reason}</td>
                            <td>
                              {slotList.length === 0 ? (
                                <span style={{ color: '#cbd5e1' }}>-</span>
                              ) : (
                                <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                   {slotList.map((slotInfo, idx) => (
                                      <div key={idx}>
                                        {slotInfo.accepted ? (
                                          <span style={{ color: 'var(--success)', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                                            <Check size={12} style={{ marginRight: '2px' }} /> 
                                            S{slotInfo.slot}: {slotInfo.accepted}
                                          </span>
                                        ) : (
                                          <span style={{ color: 'var(--warning)', fontWeight: '500', display: 'flex', alignItems: 'center' }}>
                                            <Clock size={12} style={{ marginRight: '2px' }} /> 
                                            S{slotInfo.slot}: Waiting ({slotInfo.pendingCount})
                                          </span>
                                        )}
                                      </div>
                                   ))}
                                </div>
                              )}
                            </td>
                            <td>
                              <StatusBadge status={l.status} />
                            </td>
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
      </div>

      {showLeaveForm && (
        <LeaveApplicationForm
          user={user}
          allUsers={allUsers} 
          onClose={() => setShowLeaveForm(false)}
          onSubmit={(data) => {
            onRequestLeave(data);
            setShowLeaveForm(false);
          }}
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

      setLeaves(leavesRes.data);
      setTimetable(timetableRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data", err);
      // If auth error, maybe logout
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token');
        setCurrentUser(null);
      }
    } finally {
        if (showLoader) setIsLoading(false);
    }
  }, []);

  // Check for existing token on load
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    axios
      .get(`${API_URL}/auth/me`, { headers: { 'x-auth-token': token } })
      .then(res => {
        setCurrentUser(res.data);
        fetchDashboardData(true);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setCurrentUser(null);
      });
  }
}, [fetchDashboardData]);


  // Refresh data when user changes
 

  // NEW HANDLER: Set loading immediately before setting user to avoid empty dashboard flash
// NEW — fixes auto-load after signin
const handleLoginSuccess = async () => {
  setIsLoading(true);

  try {
    const token = localStorage.getItem('token');
    if (!token) return;

    const config = { headers: { 'x-auth-token': token } };

    // 1️⃣ Fetch authoritative user
    const meRes = await axios.get(`${API_URL}/auth/me`, config);
    setCurrentUser(meRes.data);

    // 2️⃣ Load dashboard data AFTER user is set
    await fetchDashboardData(true);
  } catch (err) {
    console.error('Post-login load failed', err);
    addToast('Session expired. Please login again.', 'error');
    localStorage.removeItem('token');
    setCurrentUser(null);
  } finally {
    setIsLoading(false);
  }
};


  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleRequestLeave = async (formData) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'x-auth-token': token } };
      
      await axios.post(`${API_URL}/data/leaves`, formData, config);
      
      await fetchDashboardData(); // Refresh all data to sync
      addToast("Leave request submitted! Substitutes have been notified.", "success");
    } catch (err) {
      // FIX: Display specific error message from server
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

      // Refresh data to reflect changes in timetable if accepted (silent update)
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
      
      // Refresh to show updated status and balance (silent update)
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
            />
        )
      ) : (
        <Login onLogin={handleLoginSuccess} addToast={addToast} />
      )}
    </>
  );
};

export default App;
