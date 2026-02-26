import Sidebar from './Sidebar';
import TimetableView from '../timetable/TimetableView';
import FacultyOverview from './FacultyOverview';

export default function Dashboard({
  user,
  users,
  leaves,
  timetable,
  actions
}) {
  const [view, setView] = useState('dashboard');

  return (
    <div className="app-layout">
      <Sidebar user={user} setView={setView} />
      <main className="main-content">
        {view === 'timetable' && <TimetableView user={user} timetable={timetable} />}
        {view === 'faculty' && <FacultyOverview users={users} leaves={leaves} />}
        {/* other sections */}
      </main>
    </div>
  );
}
