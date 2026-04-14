// ─────────────────────────────────────────────
//  DRIVE SHARE SERVICE  (Free Version)
//
//  Pushes files to Google Drive via the installed
//  Drive app using iOS Share Sheet / Android Intent.
//  No OAuth. No API key. No cost.
//
//  Files land in the ROOT of Google Drive by default
//  because Drive app defaults to "My Drive" when
//  opened via share sheet with no prior folder selected.
//
//  PRO VERSION (future): Replace sendToDrive() with
//  direct Drive REST API upload to a specific folder,
//  background uploads, and progress tracking.
// ─────────────────────────────────────────────

import { Platform, Linking } from 'react-native';
import Share from 'react-native-share';
import RNFS from 'react-native-fs';

// ── Bundle IDs / URL schemes ──────────────────
const GOOGLE_DRIVE_IOS_SCHEME   = 'googledrive://';
const GOOGLE_DRIVE_IOS_BUNDLE   = 'com.google.Drive';
const GOOGLE_DRIVE_ANDROID_PKG  = 'com.google.android.apps.docs';

// ─────────────────────────────────────────────
//  CHECK IF DRIVE IS INSTALLED
// ─────────────────────────────────────────────
export async function isDriveInstalled() {
  try {
    if (Platform.OS === 'ios') {
      return await Linking.canOpenURL(GOOGLE_DRIVE_IOS_SCHEME);
    }
    // Android: react-native-share handles this internally
    // We return true and let Share fail gracefully if not installed
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────
//  MIME TYPE RESOLVER
// ─────────────────────────────────────────────
const MIME_MAP = {
  // Video
  mp4: 'video/mp4', mov: 'video/quicktime', mkv: 'video/x-matroska',
  avi: 'video/x-msvideo', wmv: 'video/x-ms-wmv', m4v: 'video/x-m4v',
  '3gp': 'video/3gpp', webm: 'video/webm', flv: 'video/x-flv',
  // Photo
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  gif: 'image/gif', bmp: 'image/bmp', webp: 'image/webp',
  heic: 'image/heic', heif: 'image/heif', tiff: 'image/tiff',
  svg: 'image/svg+xml',
  // Audio
  mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac',
  aac: 'audio/aac', m4a: 'audio/m4a', ogg: 'audio/ogg', wma: 'audio/x-ms-wma',
  // Docs
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain', csv: 'text/csv', json: 'application/json',
  xml: 'application/xml', html: 'text/html',
  // Archives
  zip: 'application/zip', rar: 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed', gz: 'application/gzip',
};

function getMimeType(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase() ?? '';
  return MIME_MAP[ext] || 'application/octet-stream';
}

// ─────────────────────────────────────────────
//  PREPARE FILE FOR SHARING
//  Camera Roll URIs (ph://) must be copied to
//  a temp path before sharing on iOS.
// ─────────────────────────────────────────────
async function prepareFilePath(file) {
  // iOS Camera Roll asset  (ph://xxxxx)
  if (Platform.OS === 'ios' && file.path.startsWith('ph://')) {
    const destPath = `${RNFS.TemporaryDirectoryPath}/${file.name}`;
    // Check if already copied
    const exists = await RNFS.exists(destPath);
    if (!exists) {
      await RNFS.copyAssetsFileIOS(file.path, destPath, 0, 0);
    }
    return destPath;
  }

  // Android content URI
  if (Platform.OS === 'android' && file.path.startsWith('content://')) {
    const destPath = `${RNFS.TemporaryDirectoryPath}/${file.name}`;
    const exists = await RNFS.exists(destPath);
    if (!exists) {
      await RNFS.copyFile(file.path, destPath);
    }
    return destPath;
  }

  return file.path;
}

// ─────────────────────────────────────────────
//  SEND TO GOOGLE DRIVE  (Free Version)
//
//  Opens Google Drive's "Save" flow via Share Sheet.
//  Drive defaults to "My Drive" (root folder).
//  User sees Drive's native upload confirmation.
//
//  files: Array of file objects from FileScanner
//  onProgress: callback({ current, total, filename })
// ─────────────────────────────────────────────
export async function sendToDrive(files, onProgress) {
  if (!files || files.length === 0) {
    throw new Error('No files selected');
  }

  onProgress?.({ stage: 'preparing', current: 0, total: files.length });

  // ── Single file ───────────────────────────
  if (files.length === 1) {
    const file = files[0];
    const filePath = await prepareFilePath(file);
    const mimeType = getMimeType(file.name);

    onProgress?.({ stage: 'sharing', current: 1, total: 1, filename: file.name });

    await Share.shareSingle({
      url: Platform.OS === 'ios' ? filePath : `file://${filePath}`,
      type: mimeType,
      title: `Save ${file.name} to Google Drive`,
      // Force Google Drive as the target (iOS)
      appId: Platform.OS === 'ios' ? GOOGLE_DRIVE_IOS_BUNDLE : GOOGLE_DRIVE_ANDROID_PKG,
      // Fallback: if Drive not installed, show full sheet
      failOnCancel: false,
    }).catch(() => {
      // Drive not installed — fall back to full share sheet
      return Share.open({
        url: Platform.OS === 'ios' ? filePath : `file://${filePath}`,
        type: mimeType,
        title: `Save ${file.name}`,
        failOnCancel: false,
      });
    });

    return { shared: [file], failed: [] };
  }

  // ── Multiple files ────────────────────────
  //  iOS Share Sheet supports multiple URLs.
  //  We send them all at once; Drive batches them.
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

  try {
    if (Platform.OS === 'ios') {
      // iOS supports multi-file share natively
      await Share.open({
        urls: preparedPaths.map(p => p.url),
        title: `Save ${preparedPaths.length} files to Google Drive`,
        failOnCancel: false,
        excludedActivityTypes: [],
      });
    } else {
      // Android: share one by one (Intent doesn't batch well across apps)
      for (const item of preparedPaths) {
        await Share.shareSingle({
          url: item.url,
          type: item.type,
          social: Share.Social.GOOGLE_DRIVE_ANDROID,
          failOnCancel: false,
        });
      }
    }
  } catch (e) {
    throw new Error(`Share failed: ${e.message}`);
  }

  return {
    shared: preparedPaths.map(p => p.file),
    failed,
  };
}

// ─────────────────────────────────────────────
//  OPEN DRIVE APP  (direct launch)
// ─────────────────────────────────────────────
export async function openDriveApp() {
  if (Platform.OS === 'ios') {
    const canOpen = await Linking.canOpenURL(GOOGLE_DRIVE_IOS_SCHEME);
    if (canOpen) {
      await Linking.openURL(GOOGLE_DRIVE_IOS_SCHEME);
    } else {
      // Open App Store listing for Google Drive
      await Linking.openURL('https://apps.apple.com/app/google-drive/id507874739');
    }
  } else {
    await Linking.openURL(
      `market://details?id=${GOOGLE_DRIVE_ANDROID_PKG}`
    ).catch(() =>
      Linking.openURL(
        `https://play.google.com/store/apps/details?id=${GOOGLE_DRIVE_ANDROID_PKG}`
      )
    );
  }
}
