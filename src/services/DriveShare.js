// ─────────────────────────────────────────────
//  DRIVE SHARE SERVICE  (Free Version)
//  Pushes files via iOS Share Sheet
//  No OAuth. No API key. No cost.
// ─────────────────────────────────────────────

import { Platform, Linking } from 'react-native';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

const GOOGLE_DRIVE_IOS_SCHEME  = 'googledrive://';
const GOOGLE_DRIVE_IOS_BUNDLE  = 'com.google.Drive';
const GOOGLE_DRIVE_ANDROID_PKG = 'com.google.android.apps.docs';

// ── Always try Drive first, fallback to share sheet ──
export async function isDriveInstalled() {
  try {
    if (Platform.OS === 'ios') {
      const canOpen = await Linking.canOpenURL(GOOGLE_DRIVE_IOS_SCHEME);
      return canOpen;
    }
    return true;
  } catch {
    // On sideloaded apps URL scheme check may fail
    // Return true and let share sheet handle it
    return true;
  }
}

const MIME_MAP = {
  mp4:'video/mp4', mov:'video/quicktime', mkv:'video/x-matroska',
  avi:'video/x-msvideo', wmv:'video/x-ms-wmv', m4v:'video/x-m4v',
  '3gp':'video/3gpp', webm:'video/webm',
  jpg:'image/jpeg', jpeg:'image/jpeg', png:'image/png',
  gif:'image/gif', bmp:'image/bmp', webp:'image/webp',
  heic:'image/heic', heif:'image/heif',
  mp3:'audio/mpeg', wav:'audio/wav', flac:'audio/flac',
  aac:'audio/aac', m4a:'audio/m4a', ogg:'audio/ogg',
  pdf:'application/pdf',
  doc:'application/msword',
  docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls:'application/vnd.ms-excel',
  xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt:'text/plain', csv:'text/csv', json:'application/json',
  zip:'application/zip', rar:'application/x-rar-compressed',
};

function getMimeType(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase() ?? '';
  return MIME_MAP[ext] || 'application/octet-stream';
}

async function prepareFilePath(file) {
  if (Platform.OS === 'ios' && file.path.startsWith('ph://')) {
    const destPath = `${RNFS.TemporaryDirectoryPath}/${file.name}`;
    const exists = await RNFS.exists(destPath);
    if (!exists) await RNFS.copyAssetsFileIOS(file.path, destPath, 0, 0);
    return destPath;
  }
  if (Platform.OS === 'android' && file.path.startsWith('content://')) {
    const destPath = `${RNFS.TemporaryDirectoryPath}/${file.name}`;
    const exists = await RNFS.exists(destPath);
    if (!exists) await RNFS.copyFile(file.path, destPath);
    return destPath;
  }
  return file.path;
}

export async function sendToDrive(files, onProgress) {
  if (!files || files.length === 0) throw new Error('No files selected');

  onProgress?.({ stage: 'preparing', current: 0, total: files.length });

  if (files.length === 1) {
    const file = files[0];
    const filePath = await prepareFilePath(file);
    const mimeType = getMimeType(file.name);
    onProgress?.({ stage: 'sharing', current: 1, total: 1, filename: file.name });

    // Try Google Drive directly first, fallback to share sheet
    try {
      await Share.shareSingle({
        url: Platform.OS === 'ios' ? filePath : `file://${filePath}`,
        type: mimeType,
        appId: Platform.OS === 'ios' ? GOOGLE_DRIVE_IOS_BUNDLE : GOOGLE_DRIVE_ANDROID_PKG,
        failOnCancel: false,
      });
    } catch {
      await Share.open({
        url: Platform.OS === 'ios' ? filePath : `file://${filePath}`,
        type: mimeType,
        failOnCancel: false,
      });
    }
    return { shared: [file], failed: [] };
  }

  const preparedPaths = [];
  const failed = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    onProgress?.({ stage: 'preparing', current: i + 1, total: files.length, filename: file.name });
    try {
      const path = await prepareFilePath(file);
      preparedPaths.push({
        url: Platform.OS === 'ios' ? path : `file://${path}`,
        type: getMimeType(file.name),
        file,
      });
    } catch (e) {
      failed.push({ file, error: e.message });
    }
  }

  onProgress?.({ stage: 'sharing', current: preparedPaths.length, total: files.length });

  await Share.open({
    urls: preparedPaths.map(p => p.url),
    title: `Save ${preparedPaths.length} files to Google Drive`,
    failOnCancel: false,
  });

  return { shared: preparedPaths.map(p => p.file), failed };
}

export async function openDriveApp() {
  if (Platform.OS === 'ios') {
    const canOpen = await Linking.canOpenURL(GOOGLE_DRIVE_IOS_SCHEME);
    if (canOpen) {
      await Linking.openURL(GOOGLE_DRIVE_IOS_SCHEME);
    } else {
      await Linking.openURL('https://apps.apple.com/app/google-drive/id507874739');
    }
  } else {
    await Linking.openURL(
      `market://details?id=${GOOGLE_DRIVE_ANDROID_PKG}`
    ).catch(() =>
      Linking.openURL(`https://play.google.com/store/apps/details?id=${GOOGLE_DRIVE_ANDROID_PKG}`)
    );
  }
}