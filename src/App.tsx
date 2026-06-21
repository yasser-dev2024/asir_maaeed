import { useCallback, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SmartHealthEntry } from './components/SmartHealthEntry';
import { SplashScreen } from './components/SplashScreen';
import { AppRoutes } from './routes/AppRoutes';
import { useAppStore } from './store/appStore';

function App() {
  const setSplashSeen = useAppStore((state) => state.setSplashSeen);
  const smartEntryCompleted = useAppStore((state) => state.smartEntryCompleted);
  const adminPath = window.location.pathname.startsWith('/admin');
  const assistantPath = window.location.pathname === '/assistant';
  const searchParams = new URLSearchParams(window.location.search);
  const forceSplash = searchParams.get('showSplash') === '1';
  const forceEntry = searchParams.get('showEntry') === '1';
  const [splashDone, setSplashDone] = useState(() => window.sessionStorage.getItem('saif-seha-splash-v2') === '1');
  const overlayAllowed = !adminPath && !assistantPath;
  const splashVisible = overlayAllowed && (forceSplash || !splashDone);
  const smartEntryVisible = overlayAllowed && !splashVisible && (forceEntry || !smartEntryCompleted);
  const completeSplash = useCallback(() => {
    window.sessionStorage.setItem('saif-seha-splash-v2', '1');
    setSplashDone(true);
    setSplashSeen();
  }, [setSplashSeen]);

  return (
    <>
      <SplashScreen autoClose={!forceSplash} onDone={completeSplash} visible={splashVisible} />
      <BrowserRouter>
        <AppRoutes />
        <SmartHealthEntry force={forceEntry} visible={smartEntryVisible} />
      </BrowserRouter>
    </>
  );
}

export default App;
