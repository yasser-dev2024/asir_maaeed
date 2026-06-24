import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { getAdminLoginLockRemainingSeconds, useAppStore } from '../../store/appStore';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);
  const authenticated = useAppStore((state) => state.adminAuthenticated);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (authenticated) {
    return <Navigate replace to="/admin" />;
  }

  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lockRemainingSeconds = getAdminLoginLockRemainingSeconds();
    if (lockRemainingSeconds > 0) {
      setError(`تم إيقاف محاولات الدخول مؤقتًا. حاول بعد ${Math.ceil(lockRemainingSeconds / 60)} دقيقة.`);
      return;
    }

    setLoading(true);
    setError('');
    const valid = await login(email, password);
    setLoading(false);

    if (valid) {
      navigate('/admin');
      return;
    }

    const nextLockRemainingSeconds = getAdminLoginLockRemainingSeconds();
    if (nextLockRemainingSeconds > 0) {
      setError(`تم إيقاف محاولات الدخول مؤقتًا. حاول بعد ${Math.ceil(nextLockRemainingSeconds / 60)} دقيقة.`);
      return;
    }

    setError('بيانات الدخول غير صحيحة.');
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-950 px-4 py-8 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white p-5 text-slate-950 shadow-2xl shadow-slate-950/40">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-lg bg-teal-700 text-white">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <h1 className="text-xl font-black">بوابة الإدارة</h1>
            <p className="text-sm font-bold text-slate-500">صيف وصحة - مساعد</p>
          </div>
        </div>
        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            البريد الإلكتروني
            <input
              autoComplete="username"
              className="min-h-12 rounded-lg border border-slate-200 px-4 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            كلمة المرور
            <input
              autoComplete="current-password"
              className="min-h-12 rounded-lg border border-slate-200 px-4 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}
          <Button className="w-full" icon={<LockKeyhole className="size-4" />} type="submit" disabled={loading}>
            {loading ? 'جاري التحقق...' : 'دخول لوحة التحكم'}
          </Button>
        </form>
      </section>
    </main>
  );
}
