import { getDayName } from './dateUtils';

export const findAvailableSubstitutes = (
  dateStr,
  slot,
  originalUserId,
  allUsers,
  timetable,
  leaves
) => {
  const dayName = getDayName(dateStr);

  const usersOnLeave = leaves
    .filter(l => l.date === dateStr && ['Pending', 'Approved'].includes(l.status))
    .map(l => l.userId);

  return allUsers.filter(candidate => {
    if (candidate._id === originalUserId) return false;
    if (usersOnLeave.includes(candidate._id)) return false;

    const hasClass = timetable.find(t => {
      if (t.userId !== candidate._id || t.slot !== slot) return false;
      if (t.date) return t.date === dateStr;
      return t.day === dayName;
    });

    return !hasClass;
  });
};