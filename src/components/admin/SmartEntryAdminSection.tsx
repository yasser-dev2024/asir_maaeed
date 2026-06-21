import { Plus, Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/appStore';
import type { SmartEntryConfig, SmartEntryTripOption } from '../../types/domain';

function inputClass() {
  return 'min-h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100';
}

function textareaClass() {
  return 'min-h-24 rounded-lg border border-slate-200 px-3 py-3 text-sm leading-7 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100';
}

function updateConfig(config: SmartEntryConfig, updateSmartEntryConfig: (config: SmartEntryConfig) => void, next: Partial<SmartEntryConfig>) {
  updateSmartEntryConfig({ ...config, ...next });
}

function tipsToText(tips: string[]) {
  return tips.join('\n');
}

function textToTips(value: string) {
  return value.split('\n').map((item) => item.trim()).filter(Boolean);
}

function emptyTripOption(index: number): SmartEntryTripOption {
  return {
    id: `custom-option-${index}`,
    label: 'خيار جديد',
    active: true,
    ageGroupIds: ['18-49'],
    title: 'عنوان النتيجة',
    healthNotice: 'تنبيه صحي قصير مناسب للخيار.',
    tips: ['نصيحة أولى', 'نصيحة ثانية'],
    ctaLabel: 'افتح الخريطة',
    mapUrl: '/nearby',
    route: '/nearby',
  };
}

export function SmartEntryAdminSection() {
  const config = useAppStore((state) => state.smartEntryConfig);
  const updateSmartEntryConfig = useAppStore((state) => state.updateSmartEntryConfig);
  const resetSmartEntry = useAppStore((state) => state.resetSmartEntry);
  const qrVisits = useAppStore((state) => state.qrVisits);
  const [newAgeId, setNewAgeId] = useState('');
  const [newAgeLabel, setNewAgeLabel] = useState('');
  const [newAgeMessage, setNewAgeMessage] = useState('');

  function updateAgeGroup(id: string, patch: Partial<(typeof config.ageGroups)[number]>) {
    updateConfig(config, updateSmartEntryConfig, {
      ageGroups: config.ageGroups.map((group) => (group.id === id ? { ...group, ...patch } : group)),
    });
  }

  function updateYesNo(id: string, patch: Partial<(typeof config.yesNoQuestions)[number]>) {
    updateConfig(config, updateSmartEntryConfig, {
      yesNoQuestions: config.yesNoQuestions.map((question) => (question.id === id ? { ...question, ...patch } : question)),
    });
  }

  function updateFacility(id: string, patch: Partial<(typeof config.facilityOptions)[number]>) {
    updateConfig(config, updateSmartEntryConfig, {
      facilityOptions: config.facilityOptions.map((option) => (option.id === id ? { ...option, ...patch } : option)),
    });
  }

  function updateTrip(id: string, patch: Partial<SmartEntryTripOption>) {
    updateConfig(config, updateSmartEntryConfig, {
      tripOptions: config.tripOptions.map((option) => (option.id === id ? { ...option, ...patch } : option)),
    });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" id="smart-entry">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-950">إدارة شاشة البداية الذكية</h2>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-500">
            تتحكم هذه الإعدادات في شاشة Smart Health Entry بعد السبلاش مباشرة.
          </p>
        </div>
        <Button icon={<Save className="size-4" />} onClick={resetSmartEntry} variant="secondary">
          إظهارها للمستخدم التالي
        </Button>
      </div>

      <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm font-bold leading-7 text-emerald-900">
        سجل QR يحفظ Visitor ID عشوائي وQR Source والوقت والمسار فقط. لا يتم استخدام رقم جوال أو IMEI أو مواصفات جهاز.
        <span className="block text-emerald-700">عدد سجلات QR غير الشخصية: {qrVisits.length.toLocaleString('ar-SA')}</span>
      </div>

      <div className="mt-5 grid gap-5">
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          ملاحظة الخصوصية
          <textarea
            className={textareaClass()}
            onChange={(event) => updateConfig(config, updateSmartEntryConfig, { privacyNote: event.target.value })}
            value={config.privacyNote}
          />
        </label>

        <div className="rounded-lg bg-slate-50 p-3">
          <h3 className="font-black text-slate-950">رسائل الفئات العمرية</h3>
          <div className="mt-3 grid gap-3">
            {config.ageGroups.map((group) => (
              <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3" key={group.id}>
                <div className="grid gap-2 sm:grid-cols-[0.6fr_1fr_auto]">
                  <input className={inputClass()} onChange={(event) => updateAgeGroup(group.id, { label: event.target.value })} value={group.label} />
                  <input className={inputClass()} onChange={(event) => updateAgeGroup(group.id, { id: event.target.value })} value={group.id} />
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <input checked={group.active} onChange={(event) => updateAgeGroup(group.id, { active: event.target.checked })} type="checkbox" />
                    تفعيل
                  </label>
                </div>
                <textarea className={textareaClass()} onChange={(event) => updateAgeGroup(group.id, { message: event.target.value })} value={group.message} />
              </div>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <input className={inputClass()} onChange={(event) => setNewAgeId(event.target.value)} placeholder="age-id" value={newAgeId} />
            <input className={inputClass()} onChange={(event) => setNewAgeLabel(event.target.value)} placeholder="اسم الفئة" value={newAgeLabel} />
            <input className={inputClass()} onChange={(event) => setNewAgeMessage(event.target.value)} placeholder="رسالة صحية" value={newAgeMessage} />
          </div>
          <Button
            className="mt-3"
            icon={<Plus className="size-4" />}
            onClick={() => {
              if (!newAgeId || !newAgeLabel) {
                return;
              }

              updateConfig(config, updateSmartEntryConfig, {
                ageGroups: [...config.ageGroups, { id: newAgeId, label: newAgeLabel, message: newAgeMessage, active: true }],
              });
              setNewAgeId('');
              setNewAgeLabel('');
              setNewAgeMessage('');
            }}
          >
            إضافة فئة عمرية
          </Button>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-black text-slate-950">أسئلة نعم/لا</h3>
            <Button
              icon={<Plus className="size-4" />}
              onClick={() =>
                updateConfig(config, updateSmartEntryConfig, {
                  yesNoQuestions: [
                    ...config.yesNoQuestions,
                    {
                      id: `custom-question-${config.yesNoQuestions.length + 1}`,
                      question: 'سؤال جديد',
                      yesLabel: 'نعم',
                      noLabel: 'لا',
                      active: true,
                    },
                  ],
                })
              }
              variant="secondary"
            >
              إضافة سؤال
            </Button>
          </div>
          <div className="mt-3 grid gap-3">
            {config.yesNoQuestions.map((question) => (
              <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3" key={question.id}>
                <input className={inputClass()} onChange={(event) => updateYesNo(question.id, { question: event.target.value })} value={question.question} />
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input className={inputClass()} onChange={(event) => updateYesNo(question.id, { yesLabel: event.target.value })} value={question.yesLabel} />
                  <input className={inputClass()} onChange={(event) => updateYesNo(question.id, { noLabel: event.target.value })} value={question.noLabel} />
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <input checked={question.active} onChange={(event) => updateYesNo(question.id, { active: event.target.checked })} type="checkbox" />
                    تفعيل
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-black text-slate-950">المرافق الصحية القريبة</h3>
            <Button
              icon={<Plus className="size-4" />}
              onClick={() =>
                updateConfig(config, updateSmartEntryConfig, {
                  facilityOptions: [
                    ...config.facilityOptions,
                    {
                      id: `facility-${config.facilityOptions.length + 1}`,
                      label: 'مرفق جديد',
                      mapUrl: '/nearby',
                      active: true,
                    },
                  ],
                })
              }
              variant="secondary"
            >
              إضافة مرفق
            </Button>
          </div>
          <div className="mt-3 grid gap-3">
            {config.facilityOptions.map((facility) => (
              <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-[0.7fr_1fr_auto]" key={facility.id}>
                <input className={inputClass()} onChange={(event) => updateFacility(facility.id, { label: event.target.value })} value={facility.label} />
                <input className={inputClass()} onChange={(event) => updateFacility(facility.id, { mapUrl: event.target.value })} value={facility.mapUrl} />
                <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <input checked={facility.active} onChange={(event) => updateFacility(facility.id, { active: event.target.checked })} type="checkbox" />
                  تفعيل
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-slate-50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-black text-slate-950">خيارات الرحلة والنصائح والروابط</h3>
            <Button
              icon={<Plus className="size-4" />}
              onClick={() =>
                updateConfig(config, updateSmartEntryConfig, {
                  tripOptions: [...config.tripOptions, emptyTripOption(config.tripOptions.length + 1)],
                })
              }
              variant="secondary"
            >
              إضافة خيار
            </Button>
          </div>
          <div className="mt-3 grid gap-3">
            {config.tripOptions.map((option) => (
              <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-3" key={option.id}>
                <div className="grid gap-2 sm:grid-cols-[0.7fr_1fr_0.7fr_auto]">
                  <input className={inputClass()} onChange={(event) => updateTrip(option.id, { label: event.target.value })} value={option.label} />
                  <input className={inputClass()} onChange={(event) => updateTrip(option.id, { title: event.target.value })} value={option.title} />
                  <input className={inputClass()} onChange={(event) => updateTrip(option.id, { ageGroupIds: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} value={option.ageGroupIds.join(', ')} />
                  <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <input checked={option.active} onChange={(event) => updateTrip(option.id, { active: event.target.checked })} type="checkbox" />
                    تفعيل
                  </label>
                </div>
                <textarea className={textareaClass()} onChange={(event) => updateTrip(option.id, { healthNotice: event.target.value })} value={option.healthNotice} />
                <textarea className={textareaClass()} onChange={(event) => updateTrip(option.id, { tips: textToTips(event.target.value) })} value={tipsToText(option.tips)} />
                <div className="grid gap-2 sm:grid-cols-3">
                  <input className={inputClass()} onChange={(event) => updateTrip(option.id, { ctaLabel: event.target.value })} value={option.ctaLabel} />
                  <input className={inputClass()} onChange={(event) => updateTrip(option.id, { mapUrl: event.target.value })} value={option.mapUrl} />
                  <input className={inputClass()} onChange={(event) => updateTrip(option.id, { route: event.target.value })} value={option.route} />
                </div>
                <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                  <input checked={Boolean(option.call937)} onChange={(event) => updateTrip(option.id, { call937: event.target.checked })} type="checkbox" />
                  إظهار زر الاتصال 937 في النتيجة
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
