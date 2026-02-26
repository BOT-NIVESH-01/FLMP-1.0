export default function TimetableView({ user, timetable }) {
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];
  const slots = [1,2,3,4,5,6,7,8];

  const getClass = (day, slot) =>
    timetable.find(t =>
      t.userId === user._id &&
      t.day === day &&
      t.slot === slot
    );

  return (
    <div className="card">
      <h3>My Weekly Timetable</h3>
      <table className="table">
        <thead>
          <tr>
            <th>Day</th>
            {slots.map(s => <th key={s}>Slot {s}</th>)}
          </tr>
        </thead>
        <tbody>
          {days.map(day => (
            <tr key={day}>
              <td>{day}</td>
              {slots.map(slot => {
                const cls = getClass(day, slot);
                return (
                  <td key={slot}>
                    {cls ? (
                      <>
                        <strong>{cls.subject}</strong>
                        <div>{cls.class}</div>
                      </>
                    ) : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
