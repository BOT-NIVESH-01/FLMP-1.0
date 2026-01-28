import api from './axios';

export const fetchUsers = () => api.get('/data/users');
export const fetchLeaves = () => api.get('/data/leaves');
export const fetchTimetable = () => api.get('/data/timetable');

export const applyLeave = (data) => api.post('/data/leaves', data);
export const updateLeaveStatus = (id, status) =>
  api.patch(`/data/leaves/${id}/status`, { status });

export const respondSubstitution = (id, payload) =>
  api.patch(`/data/leaves/${id}/substitute`, payload);

export const forceSubstitute = (id, payload) =>
  api.patch(`/data/leaves/${id}/force-substitute`, payload);