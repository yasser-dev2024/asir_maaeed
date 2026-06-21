import { useLocation, useNavigate } from 'react-router-dom';
import doctorImage from '../assets/doctor.png';

export function DoctorAssistantFloatingButton() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname.startsWith('/admin') || location.pathname === '/assistant') {
    return null;
  }

  return (
    <button
      aria-label="فتح الدكتور مساعد"
      className="doctor-float fixed bottom-[calc(env(safe-area-inset-bottom)+5.7rem)] right-3 z-30 flex items-end gap-2 rounded-full border border-teal-100 bg-white/95 px-2 py-2 shadow-2xl shadow-teal-950/20 backdrop-blur transition hover:-translate-y-1 sm:bottom-6"
      onClick={() => navigate('/assistant')}
      type="button"
    >
      <span className="rounded-full bg-teal-700 px-3 py-2 text-xs font-black text-white shadow-lg shadow-teal-950/20">
        اسألني الآن
      </span>
      <span className="grid size-16 place-items-end overflow-hidden rounded-full border-2 border-white bg-teal-50 shadow-lg shadow-slate-950/15">
        <img alt="الدكتور مساعد" className="h-20 w-16 object-cover object-top" src={doctorImage} />
      </span>
    </button>
  );
}
