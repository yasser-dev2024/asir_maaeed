import { useEffect } from 'react';
import { fetchRemoteSnapshot, seedRemote } from '../services/remoteSync';
import { useAppStore } from '../store/appStore';

export function RemoteDataProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cancelled = false;

    async function sync() {
      const local = useAppStore.getState();
      const remote = await fetchRemoteSnapshot(local.qrLocations);
      if (!remote || cancelled) return;

      const isEmpty =
        remote.events.length === 0 &&
        remote.contents.length === 0 &&
        remote.keywordAnswers.length === 0 &&
        remote.doctorAssistantQuestions.length === 0 &&
        remote.qrLocations.length === 0 &&
        !remote.smartEntryConfig;

      if (isEmpty) {
        await seedRemote({
          events: local.events,
          contents: local.contents,
          keywordAnswers: local.keywordAnswers,
          doctorAssistantQuestions: local.doctorAssistantQuestions,
          qrLocations: local.qrLocations,
          smartEntryConfig: local.smartEntryConfig,
        });
        return;
      }

      useAppStore.setState({
        events: (remote.events.length ? remote.events : local.events).map((re) => {
          const loc = local.events.find((le) => le.id === re.id);
          return { ...re, visits: loc?.visits ?? 0 };
        }),
        contents: remote.contents.length ? remote.contents : local.contents,
        keywordAnswers: (remote.keywordAnswers.length ? remote.keywordAnswers : local.keywordAnswers).map((rk) => {
          const loc = local.keywordAnswers.find((lk) => lk.id === rk.id);
          return { ...rk, usage: loc?.usage ?? 0 };
        }),
        doctorAssistantQuestions: remote.doctorAssistantQuestions.length
          ? remote.doctorAssistantQuestions
          : local.doctorAssistantQuestions,
        qrLocations: (remote.qrLocations.length ? remote.qrLocations : local.qrLocations).map((rl) => {
          const loc = local.qrLocations.find((ll) => ll.id === rl.id);
          return { ...rl, scans: rl.scans || loc?.scans || 0, lastScanAt: rl.lastScanAt || loc?.lastScanAt || '' };
        }),
        ...(remote.smartEntryConfig ? { smartEntryConfig: remote.smartEntryConfig } : {}),
      });
    }

    void sync();

    // Poll every 15 s for live updates
    const interval = window.setInterval(() => { void sync(); }, 15_000);

    // Re-fetch when tab becomes visible
    const onVisible = () => {
      if (document.visibilityState === 'visible') void sync();
    };
    document.addEventListener('visibilitychange', onVisible);

    // Re-fetch when network comes back
    const onOnline = () => { void sync(); };
    window.addEventListener('online', onOnline);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  return <>{children}</>;
}
