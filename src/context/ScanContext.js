// ─────────────────────────────────────────────
//  SCAN CONTEXT
//  Global state: scan results, storage info,
//  progress. Triggers scan on first load and
//  exposes rescan().
// ─────────────────────────────────────────────

import React, {
  createContext, useContext, useState,
  useEffect, useCallback,
} from 'react';
import { Alert, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { scanDevice, getStorageInfo } from '../services/FileScanner';

const ScanContext = createContext(null);

export function ScanProvider({ children }) {
  const [scanData, setScanData]       = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);
  const [isScanning, setIsScanning]   = useState(false);
  const [scanProgress, setScanProgress] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // ── Permission request ────────────────────
  const requestPermissions = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        // iOS: Camera Roll (photos + videos)
        const photoResult = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        if (photoResult !== RESULTS.GRANTED) {
          Alert.alert(
            'Permission Required',
            'FileIQ needs access to your Photo Library to scan photos and videos.',
            [{ text: 'OK' }]
          );
          return false;
        }
        return true;
      } else {
        // Android 13+: granular media permissions
        const imgResult   = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
        const videoResult = await request(PERMISSIONS.ANDROID.READ_MEDIA_VIDEO);
        const audioResult = await request(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);
        // Legacy Android 12 and below
        const storageResult = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);

        const anyGranted = [imgResult, videoResult, audioResult, storageResult]
          .some(r => r === RESULTS.GRANTED);

        if (!anyGranted) {
          Alert.alert(
            'Permission Required',
            'FileIQ needs storage access to scan your files.',
            [{ text: 'OK' }]
          );
          return false;
        }
        return true;
      }
    } catch (e) {
      console.warn('[Permissions] Error:', e);
      return false;
    }
  }, []);

  // ── Full scan ─────────────────────────────
  const runScan = useCallback(async () => {
    setIsScanning(true);
    setScanProgress({ stage: 'start', message: 'Requesting permissions…', percent: 0 });

    const granted = await requestPermissions();
    setPermissionsGranted(granted);

    if (!granted) {
      setIsScanning(false);
      return;
    }

    try {
      // Storage info
      const storage = await getStorageInfo();
      setStorageInfo(storage);

      // File scan
      const data = await scanDevice((prog) => {
        setScanProgress(prog);
      });

      setScanData(data);
    } catch (e) {
      Alert.alert('Scan Error', `Could not complete scan: ${e.message}`);
    } finally {
      setIsScanning(false);
    }
  }, [requestPermissions]);

  // ── Run on mount ──────────────────────────
  useEffect(() => {
    runScan();
  }, []);

  const value = {
    scanData,
    storageInfo,
    isScanning,
    scanProgress,
    permissionsGranted,
    rescan: runScan,
  };

  return (
    <ScanContext.Provider value={value}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScanContext() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScanContext must be inside ScanProvider');
  return ctx;
}
