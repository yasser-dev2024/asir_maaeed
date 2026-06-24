import { useEffect } from 'react';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchRemoteSnapshot, seedRemote } from '../services/remoteSync';
import { useAppStore } from '../store/appStore';

export function RemoteDataProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    async function sync() {
      const localState = useAppStore.getState();
      const remote = await fetchRemoteSnapshot(localState.qrLocations);
      if (!remote || cancelled) return;

      const remoteIsEmpty =
        remote.events.length === 0 &&
        remote.contents.length === 0 &&
        remote.keywordAnswers.length === 0 &&
        remote.doctorAssistantQuestions.length === 0 &&
        remote.qrLocations.length === 0 &&
        !remote.smartEntryConfig;

      const remoteMissingCore =
        remote.doctorAssistantQuestions.length === 0 ||
        remote.qrLocations.length === 0 ||
        !remote.smartEntryConfig;

      if (remoteIsEmpty) {
        // First-time setup: push local data to Supabase so other devices see it
        await seedRemote({
          events: localState.events,
          contents: localState.contents,
          keywordAnswers: localState.keywordAnswers,
          doctorAssistantQuestions: localState.doctorAssistantQuestions,
          qrLocations: localState.qrLocations,
          smartEntryConfig: localState.smartEntryConfig,
        });
        return;
      }

      if (remoteMissingCore) {
        await seedRemote({
          events: localState.events,
          contents: localState.contents,
          keywordAnswers: localState.keywordAnswers,
          doctorAssistantQuestions: localState.doctorAssistantQuestions,
          qrLocations: localState.qrLocations,
          smartEntryConfig: localState.smartEntryConfig,
        });
      }

      // Merge: remote provides the canonical content; local preserves per-device metrics
      const localEvents = localState.events;
      const localKeywords = localState.keywordAnswers;
      const localQrLocations = localState.qrLocations;

      useAppStore.setState({
        events: (remote.events.length ? remote.events : localEvents).map((re) => {
          const local = localEvents.find((le) => le.id === re.id);
          return { ...re, visits: local?.visits ?? 0 };
        }),
        contents: remote.contents.length ? remote.contents : localState.contents,
        keywordAnswers: (remote.keywordAnswers.length ? remote.keywordAnswers : localKeywords).map((rk) => {
          const local = localKeywords.find((lk) => lk.id === rk.id);
          return { ...rk, usage: local?.usage ?? 0 };
        }),
        doctorAssistantQuestions: remote.doctorAssistantQuestions.length
          ? remote.doctorAssistantQuestions
          : localState.doctorAssistantQuestions,
        qrLocations: (remote.qrLocations.length ? remote.qrLocations : localQrLocations).map((rl) => {
          const local = localQrLocations.find((ll) => ll.id === rl.id);
          return { ...rl, scans: local?.scans ?? 0, lastScanAt: local?.lastScanAt ?? '' };
        }),
        ...(remote.smartEntryConfig ? { smartEntryConfig: remote.smartEntryConfig } : {}),
      });
    }

    void sync();
    const interval = window.setInterval(() => {
      void sync();
    }, 15000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void sync();
      }
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return <>{children}</>;
}
