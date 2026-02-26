export default function FacultyOverview({ users, leaves }) {
  const today = new Date().toISOString().split('T')[0];

  const getStatus = userId => {
    const leave = leaves.find(
      l =>
        l.userId === userId &&
        l.date === today &&
        ['Approved', 'Pending'].includes(l.status)
    );
    return leave ? 'On Leave' : 'Available';
  };

  return (
    <div className="card">
      <h3>Faculty Overview (Today)</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Dept</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.name}</td>
              <td>{u.department}</td>
              <td>{getStatus(u._id)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
