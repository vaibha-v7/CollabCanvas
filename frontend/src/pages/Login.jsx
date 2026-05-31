import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  Users,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/shared/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.data.user, res.data.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fb] text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(79,70,229,0.16),transparent_28%),radial-gradient(circle_at_84%_12%,rgba(20,184,166,0.16),transparent_28%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_48%,#ecfeff_100%)]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="hidden lg:block">
          <Link to="/" className="mb-14 inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white shadow-lg shadow-slate-900/20">
              <Logo className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xl font-semibold tracking-normal">CollabCanvas</span>
              <span className="block text-sm text-slate-500">Live creative workspace</span>
            </span>
          </Link>

          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-teal-600" aria-hidden="true" />
              Designed for fast team sketching
            </div>
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-normal text-slate-950">
              Pick up exactly where your ideas left off.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Sign in to rejoin rooms, review shared boards, and keep every cursor, note, and sketch moving with your team.
            </p>

            <div className="mt-10 grid max-w-lg grid-cols-2 gap-4">
              <div className="rounded-lg border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                <Users className="mb-4 h-5 w-5 text-indigo-600" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-900">Shared rooms</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Your collaborative spaces stay organized and ready.</p>
              </div>
              <div className="rounded-lg border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
                <Logo className="mb-4 h-5 w-5 text-slate-950" />
                <p className="text-sm font-semibold text-slate-900">Personal cursor</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">Every participant remains easy to spot.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white shadow-lg shadow-slate-900/20">
                <Logo className="h-5 w-5" />
              </span>
              <span className="text-xl font-semibold tracking-normal">CollabCanvas</span>
            </Link>
          </div>

          <div className="rounded-lg border border-white/80 bg-white/85 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-8">
            <div className="mb-7">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Welcome back</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">Sign in</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Continue to your rooms and live boards.</p>
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
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-10 pr-12 text-sm text-slate-900 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-indigo-600 transition hover:text-indigo-700">
                Create one
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
