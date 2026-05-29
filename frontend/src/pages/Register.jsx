import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Palette,
  PenLine,
  Sparkles,
  User,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const COLORS = [
  '#534AB7', '#0F6E56', '#993C1D',
  '#185FA5', '#854F0B', '#A32D2D', '#3B6D11',
];

const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    displayColor: randomColor(),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6)
      return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.data.user, res.data.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f8fb] text-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(20,184,166,0.16),transparent_29%),radial-gradient(circle_at_82%_12%,rgba(79,70,229,0.15),transparent_27%),linear-gradient(135deg,#f8fafc_0%,#ecfeff_48%,#eef2ff_100%)]" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-5 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section className="mx-auto w-full max-w-md lg:order-2">
          <div className="mb-8 text-center lg:hidden">
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white shadow-lg shadow-slate-900/20">
                <Palette className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xl font-semibold tracking-normal">CollabCanvas</span>
            </Link>
          </div>

          <div className="rounded-lg border border-white/80 bg-white/85 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-8">
            <div className="mb-7">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Start collaborating</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">Create account</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">Set up your identity for shared rooms.</p>
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
                  Username
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    autoComplete="username"
                    placeholder="yourname"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
                  />
                </div>
              </div>

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
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-10 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
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
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-10 pr-12 text-sm text-slate-900 shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
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

              <div>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Cursor color
                  </label>
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                    {form.displayColor}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(c => {
                    const selected = form.displayColor === c;

                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, displayColor: c }))}
                        className="grid h-9 w-9 place-items-center rounded-lg border-2 transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-slate-200"
                        style={{
                          backgroundColor: c,
                          borderColor: selected ? '#0f172a' : 'rgba(255,255,255,0.9)',
                          boxShadow: selected ? '0 10px 24px rgba(15, 23, 42, 0.18)' : 'none',
                        }}
                        aria-label={`Choose cursor color ${c}`}
                        title={`Choose cursor color ${c}`}
                      >
                        {selected && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Creating account...' : 'Create account'}
                {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-teal-700 transition hover:text-teal-800">
                Sign in
              </Link>
            </p>
          </div>
        </section>

        <section className="hidden lg:block">
          <Link to="/" className="mb-14 inline-flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white shadow-lg shadow-slate-900/20">
              <Palette className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xl font-semibold tracking-normal">CollabCanvas</span>
              <span className="block text-sm text-slate-500">Live creative workspace</span>
            </span>
          </Link>

          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/65 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-indigo-600" aria-hidden="true" />
              Your workspace identity
            </div>
            <h1 className="text-5xl font-semibold leading-[1.05] tracking-normal text-slate-950">
              Join rooms with a name, color, and presence people recognize.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
              Create a profile that feels clear in busy whiteboards, design sessions, and quick project huddles.
            </p>

            <div className="mt-10 rounded-lg border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur">
              <div className="mb-5 flex items-center gap-3">
                <span
                  className="grid h-12 w-12 place-items-center rounded-lg text-base font-semibold text-white"
                  style={{ backgroundColor: form.displayColor }}
                >
                  {form.username?.[0]?.toUpperCase() || 'Y'}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {form.username || 'Your name'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {form.email || 'you@example.com'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-indigo-50 p-3">
                  <PenLine className="mb-7 h-4 w-4 text-indigo-600" aria-hidden="true" />
                  <div className="h-1.5 rounded-full bg-indigo-200" />
                </div>
                <div className="rounded-lg bg-teal-50 p-3">
                  <Palette className="mb-7 h-4 w-4 text-teal-700" aria-hidden="true" />
                  <div className="h-1.5 rounded-full bg-teal-200" />
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <Sparkles className="mb-7 h-4 w-4 text-amber-700" aria-hidden="true" />
                  <div className="h-1.5 rounded-full bg-amber-200" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
