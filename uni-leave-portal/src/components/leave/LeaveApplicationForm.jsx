import { useState, useMemo } from 'react';
import { getDayName, getDatesInRange } from '../../utils/dateUtils';
import { findAvailableSubstitutes } from '../../utils/substitutionEngine';

export default function LeaveApplicationForm({
  user,
  timetable,
  allUsers,
  leaves,
  onSubmit,
  onClose,
  addToast
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    type: 'Casual',
    date: '',
    endDate: '',
    reason: '',
    substitutions: []
  });

  const classes = useMemo(() => {
    if (!form.date) return [];
    const dates =
      form.type === 'Medical' && form.endDate
        ? getDatesInRange(form.date, form.endDate)
        : [form.date];

    return dates.flatMap(date => {
      const day = getDayName(date);
      return timetable
        .filter(t => t.userId === user._id && t.day === day)
        .map(t => ({ ...t, date }));
    });
  }, [form, timetable, user]);

  const handleNext = () => {
    if (!form.date || !form.reason) {
      addToast('Fill all fields', 'error');
      return;
    }

    const subs = classes.flatMap(cls => {
      const available = findAvailableSubstitutes(
        cls.date,
        cls.slot,
        user._id,
        allUsers,
        timetable,
        leaves
      );

      return available.length
        ? available.map(u => ({
            date: cls.date,
            slot: cls.slot,
            subId: u._id,
            subName: u.name
          }))
        : [{
            date: cls.date,
            slot: cls.slot,
            subId: null,
            subName: 'No Faculty Available'
          }];
    });

    setForm(prev => ({ ...prev, substitutions: subs }));
    setStep(2);
  };

  if (step === 1) {
    return (
      <div className="modal">
        <input
          type="date"
          value={form.date}
          onChange={e => setForm({...form, date: e.target.value})}
        />
        <textarea
          value={form.reason}
          onChange={e => setForm({...form, reason: e.target.value})}
        />
        <button onClick={handleNext}>Next</button>
      </div>
    );
  }

  return (
    <div className="modal">
      <h4>Substitutes Generated</h4>
      <pre>{JSON.stringify(form.substitutions, null, 2)}</pre>
      <button onClick={() => onSubmit(form)}>Submit</button>
    </div>
  );
}
