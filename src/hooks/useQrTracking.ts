import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

export function useQrTracking() {
  const location = useLocation();
  const recordQrScan = useAppStore((state) => state.recordQrScan);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const qr = params.get('qr') ?? params.get('source');

    if (!qr) {
      return;
    }

    recordQrScan(qr, `${location.pathname}${location.search}`);
  }, [location.pathname, location.search, recordQrScan]);
}
