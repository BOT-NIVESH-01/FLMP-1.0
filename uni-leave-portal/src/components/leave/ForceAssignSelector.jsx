import { useState } from 'react';

export default function ForceAssignSelector({
  slot,
  candidates,
  onForceAssign
}) {
  const [selected, setSelected] = useState('');

  return (
    <div className="force-assign">
      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
      >
        <option value="">Select Substitute</option>
        {candidates.map(c => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      <button
        disabled={!selected}
        onClick={() => {
          const user = candidates.find(c => c._id === selected);
          onForceAssign(slot, user._id, user.name);
        }}
      >
        Force
      </button>
    </div>
  );
}
