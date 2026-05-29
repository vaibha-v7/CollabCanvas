import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, KeyRound, X } from 'lucide-react';
import api from '../../api/axios';

export default function JoinRoomModal({ onClose }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/rooms/join', { inviteCode: code.trim().toUpperCase() });
      onClose();
      navigate(`/room/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-950/20">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-teal-50 text-teal-700">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-slate-950">Join by code</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Enter the six-character invite code for your room.</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
            title="Close"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Room code
            </label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              placeholder="A1B2C3"
              maxLength={6}
              className="h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-center font-mono text-lg font-semibold uppercase tracking-[0.22em] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 flex-1 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Joining...' : 'Join room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
