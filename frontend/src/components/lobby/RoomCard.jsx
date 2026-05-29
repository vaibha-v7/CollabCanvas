import { useNavigate } from 'react-router-dom';
import { CalendarDays, Lock, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RoomCard({ room }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isOwner = room.ownerId?._id === user?._id || room.ownerId === user?._id;
  const initials = room.name.slice(0, 2).toUpperCase();
  const memberCount = room.members?.length ?? 0;

  const colors = [
    ['#eef2ff', '#4f46e5'],
    ['#ecfeff', '#0891b2'],
    ['#f0fdf4', '#15803d'],
    ['#fff7ed', '#c2410c'],
    ['#fdf2f8', '#be185d'],
    ['#f8fafc', '#475569'],
  ];
  const [bgColor, accentColor] = colors[room.name.charCodeAt(0) % colors.length];
  const updatedDate = room.updatedAt
    ? new Date(room.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : 'New';

  return (
    <button
      type="button"
      onClick={() => navigate(`/room/${room._id}`)}
      className="group h-56 overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/10"
    >
      <div
        className="relative flex h-24 items-center justify-center"
        style={{ backgroundColor: bgColor, color: room.ownerId?.displayColor ?? accentColor }}
      >
        <span className="text-3xl font-semibold tracking-normal">{initials}</span>
        <span className="absolute right-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          {room.isPublic ? 'Public' : 'Private'}
        </span>
      </div>

      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-base font-semibold text-slate-950">
            {room.name}
          </h3>
          {isOwner && (
            <span className="shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              Owner
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Users className="h-4 w-4" aria-hidden="true" />
          <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            {room.isPublic ? <Users className="h-3.5 w-3.5" aria-hidden="true" /> : <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
            {room.inviteCode}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            {updatedDate}
          </span>
        </div>
      </div>
    </button>
  );
}
