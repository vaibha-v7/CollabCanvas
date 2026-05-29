import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DoorOpen,
  LogOut,
  Palette,
  Plus,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import RoomCard from '../components/lobby/RoomCard';
import CreateRoomModal from '../components/lobby/CreateRoomModal';
import JoinRoomModal from '../components/lobby/JoinRoomModal';

export default function Lobby() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    let cancelled = false;

    const loadRooms = async () => {
      try {
        const res = await api.get('/rooms');
        if (!cancelled) setRooms(res.data.data);
      } catch (err) {
        console.error('Failed to fetch rooms', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRooms();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRoomCreated = (room) => {
    setRooms(prev => [room, ...prev]);
    navigate(`/room/${room._id}`);
  };

  const filtered = rooms.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );
  const totalMembers = rooms.reduce((sum, room) => sum + (room.members?.length ?? 0), 0);
  const publicRooms = rooms.filter(room => room.isPublic).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-950 text-white shadow-lg shadow-slate-900/15">
              <Palette className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-base font-semibold tracking-normal text-slate-950">CollabCanvas</p>
              <p className="hidden text-xs text-slate-500 sm:block">Collaborative whiteboard rooms</p>
            </div>
          </div>

          <div className="hidden min-w-0 flex-1 justify-center px-8 md:flex">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search rooms"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-10 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-3 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm sm:flex">
              <span
                className="grid h-7 w-7 place-items-center rounded-lg text-xs font-semibold text-white"
                style={{ backgroundColor: user?.displayColor || '#4f46e5' }}
              >
                {user?.username?.[0]?.toUpperCase()}
              </span>
              <span className="max-w-28 truncate text-sm font-medium text-slate-700">
                {user?.username}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_360px]">
            <div className="p-6 sm:p-8">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Workspace lobby
              </div>
              <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-normal text-slate-950 sm:text-4xl">
                Welcome back{user?.username ? `, ${user.username}` : ''}.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Open a recent room, create a fresh canvas, or join your team with an invite code.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  New room
                </button>
                <button
                  onClick={() => setShowJoin(true)}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <DoorOpen className="h-4 w-4" aria-hidden="true" />
                  Join by code
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0">
              <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-2xl font-semibold text-slate-950">{rooms.length}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Rooms</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-2xl font-semibold text-slate-950">{totalMembers}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Members</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-2xl font-semibold text-slate-950">{publicRooms}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Public</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-6 md:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search rooms"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            />
          </div>
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Your rooms</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading ? 'Loading rooms...' : `${filtered.length} room${filtered.length !== 1 ? 's' : ''} available`}
              </p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="hidden h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:inline-flex"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add room
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-56 animate-pulse rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="h-28 rounded-t-lg bg-slate-100" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                    <div className="h-8 rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-500">
                <Users className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-slate-950">
                {search ? 'No rooms match your search' : 'No rooms yet'}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                {search ? 'Try a different room name or clear your search.' : 'Create your first room and invite collaborators to start sketching together.'}
              </p>
              {!search && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Create your first room
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map(room => (
                <RoomCard key={room._id} room={room} />
              ))}
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="flex h-56 flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-white text-slate-500 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100">
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold">Create new room</span>
              </button>
            </div>
          )}
        </section>
      </main>

      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={handleRoomCreated}
        />
      )}

      {showJoin && (
        <JoinRoomModal onClose={() => setShowJoin(false)} />
      )}
    </div>
  );
}
