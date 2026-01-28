import { useEffect, useState } from 'react';
import { getMe } from './api/auth.api';
import * as dataApi from './api/data.api';

import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import LoaderScreen from './components/common/LoaderScreen';
import ToastContainer from './components/common/ToastContainer';

export default function App() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);

  const bootstrap = async () => {
    setLoading(true);
    try {
      const me = await getMe();
      setUser(me.data);

      const [u, l, t] = await Promise.all([
        dataApi.fetchUsers(),
        dataApi.fetchLeaves(),
        dataApi.fetchTimetable()
      ]);

      setUsers(u.data);
      setLeaves(l.data);
      setTimetable(t.data);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('token')) bootstrap();
  }, []);

  if (!user) return <Login onSuccess={bootstrap} />;
  if (loading) return <LoaderScreen />;

  return (
    <>
      <ToastContainer />
      <Dashboard
        user={user}
        users={users}
        leaves={leaves}
        timetable={timetable}
      />
    </>
  );
}
