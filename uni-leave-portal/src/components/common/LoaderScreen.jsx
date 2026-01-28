import { Loader } from 'lucide-react';

export default function LoaderScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="text-center">
        <Loader size={48} className="animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500">Loading Dashboard...</p>
      </div>
    </div>
  );
}