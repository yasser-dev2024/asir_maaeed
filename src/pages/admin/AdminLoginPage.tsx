import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { useAppStore } from '../../store/appStore';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const login = useAppStore((state) => state.login);
  const authenticated = useAppStore((state) => state.adminAuthenticated);
  const [email, setEmail] = useState('admin@aseer.health.sa');
  const [password, setPassword] = useState('Aseer@2026');
  const [error, setError] = useState('');

  if (authenticated) {
    return <Navigate replace to="/admin" />;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valid = login(email, password);
    if (valid) {
      navigate('/admin');
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
              className="min-h-12 rounded-lg border border-slate-200 px-4 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            كلمة المرور
            <input
              className="min-h-12 rounded-lg border border-slate-200 px-4 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </label>
          {error ? <p className="rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}
          <Button className="w-full" icon={<LockKeyhole className="size-4" />} type="submit">
            دخول لوحة التحكم
          </Button>
        </form>
      </section>
    </main>
  );
}
