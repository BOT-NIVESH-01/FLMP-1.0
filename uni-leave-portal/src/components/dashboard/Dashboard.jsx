import { useState } from 'react';
import Sidebar from './Sidebar';
import TimetableView from '../timetable/TimetableView';
import FacultyOverview from './FacultyOverview';
import LeaveApplicationForm from '../leave/LeaveApplicationForm';

export default function Dashboard({
  user,
  users,
  leaves,
  timetable,
  actions
}) {
  const [view, setView] = useState('dashboard');
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        setView={setView}
        currentView={view}
        onLogout={actions.logout}
      />

      <div className="main-content">
        {view === 'timetable' && (
          <TimetableView user={user} timetable={timetable} />
        )}

        {view === 'faculty' && (
          <FacultyOverview users={users} leaves={leaves} />
        )}

        {view === 'dashboard' && (
          <>
            <button onClick={() => setShowLeaveForm(true)}>
              Apply Leave
            </button>
          </>
        )}
      </div>

      {showLeaveForm && (
        <LeaveApplicationForm
          user={user}
          timetable={timetable}
          allUsers={users}
          leaves={leaves}
          onSubmit={actions.applyLeave}
          onClose={() => setShowLeaveForm(false)}
        />
      )}
    </div>
  );
}
