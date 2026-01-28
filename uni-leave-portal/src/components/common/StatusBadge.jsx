import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function StatusBadge({ status }) {
  const map = {
    Accepted: { cls: 'badge-accepted', Icon: CheckCircle },
    Approved: { cls: 'badge-approved', Icon: CheckCircle },
    Rejected: { cls: 'badge-rejected', Icon: XCircle },
    Pending: { cls: 'badge-pending', Icon: Clock }
  };

  const { cls, Icon } = map[status] || map.Pending;

  return (
    <span className={`badge ${cls}`}>
      <Icon size={12} /> {status}
    </span>
  );
}