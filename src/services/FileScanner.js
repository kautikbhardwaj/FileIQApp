// ─────────────────────────────────────────────
//  FILE SCANNER SERVICE
//  Scans device storage, indexes every file,
//  returns categorized + sorted results.
//  iOS: scans app sandbox + Camera Roll via
//       CameraRoll API for photos/videos.
// ─────────────────────────────────────────────

import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { getCategoryForFile, formatBytes } from '../utils/fileTypes';

// ── Paths to scan on iOS ──────────────────────
const IOS_SCAN_ROOTS = [
  RNFS.DocumentDirectoryPath,
  RNFS.DownloadDirectoryPath,
  RNFS.CachesDirectoryPath,
  RNFS.TemporaryDirectoryPath,
  RNFS.LibraryDirectoryPath,
];

// ── Paths to scan on Android ─────────────────
const ANDROID_SCAN_ROOTS = [
  RNFS.ExternalStorageDirectoryPath,          // /sdcard
  `${RNFS.ExternalStorageDirectoryPath}/Download`,
  `${RNFS.ExternalStorageDirectoryPath}/Documents`,
  `${RNFS.ExternalStorageDirectoryPath}/Movies`,
  `${RNFS.ExternalStorageDirectoryPath}/Music`,
  `${RNFS.ExternalStorageDirectoryPath}/Pictures`,
  `${RNFS.ExternalStorageDirectoryPath}/DCIM`,
];

// ─────────────────────────────────────────────
//  RECURSIVE DIRECTORY WALKER
// ─────────────────────────────────────────────
async function walkDirectory(dirPath, depth = 0, maxDepth = 8) {
  if (depth > maxDepth) return [];
  let results = [];

  try {
    const items = await RNFS.readDir(dirPath);

    for (const item of items) {
      // Skip hidden files / system dirs
      if (item.name.startsWith('.')) continue;
      if (item.name === 'node_modules') continue;

      if (item.isDirectory()) {
        const children = await walkDirectory(item.path, depth + 1, maxDepth);
        results = results.concat(children);
      } else {
        results.push({
          name: item.name,
          path: item.path,
          size: parseInt(item.size, 10) || 0,
          mtime: item.mtime ? Math.floor(new Date(item.mtime).getTime() / 1000) : 0,
          category: getCategoryForFile(item.name),
          ext: item.name.split('.').pop()?.toLowerCase() ?? '',
          isFromCameraRoll: false,
        });
      }
    }
  } catch (_) {
    // Permission denied on some dirs — silently skip
  }

  return results;
}

// ─────────────────────────────────────────────
//  CAMERA ROLL SCANNER  (iOS: photos & videos)
// ─────────────────────────────────────────────
async function scanCameraRoll() {
  const mediaFiles = [];

  try {
    let after = undefined;
    let hasMore = true;

    while (hasMore) {
      const result = await CameraRoll.getPhotos({
        first: 200,
        after,
        include: ['filename', 'fileSize', 'imageSize', 'playableDuration', 'location'],
        assetType: 'All',
      });

      for (const edge of result.edges) {
        const { node } = edge;
        const filename = node.image.filename || `media_${Date.now()}`;
        const isVideo = node.type.startsWith('video');

        mediaFiles.push({
          name: filename,
          path: node.image.uri,
          size: node.image.fileSize || 0,
          mtime: node.timestamp || 0,
          category: isVideo ? 'Videos' : 'Photos',
          ext: filename.split('.').pop()?.toLowerCase() ?? (isVideo ? 'mp4' : 'jpg'),
          isFromCameraRoll: true,
          duration: node.image.playableDuration || null,
          width: node.image.width,
          height: node.image.height,
        });
      }

      hasMore = result.page_info.has_next_page;
      after = result.page_info.end_cursor;

      // Safety cap: don't scan more than 5000 items in one pass
      if (mediaFiles.length >= 5000) break;
    }
  } catch (e) {
    console.warn('[Scanner] CameraRoll access failed:', e.message);
  }

  return mediaFiles;
}

// ─────────────────────────────────────────────
//  MAIN SCANNER
// ─────────────────────────────────────────────
export async function scanDevice(onProgress) {
  const roots = Platform.OS === 'ios' ? IOS_SCAN_ROOTS : ANDROID_SCAN_ROOTS;
  let allFiles = [];

  // 1. Scan file system directories
  for (let i = 0; i < roots.length; i++) {
    const root = roots[i];
    onProgress?.({
      stage: 'scanning',
      message: `Scanning ${root.split('/').pop()}…`,
      percent: Math.round((i / (roots.length + 1)) * 60),
    });
    const files = await walkDirectory(root);
    allFiles = allFiles.concat(files);
  }

  // 2. Scan Camera Roll (iOS) for photos & videos
  if (Platform.OS === 'ios') {
    onProgress?.({ stage: 'media', message: 'Reading Camera Roll…', percent: 65 });
    const mediaFiles = await scanCameraRoll();

    // Merge: deduplicate by filename to avoid double-counting
    const existingNames = new Set(allFiles.map(f => f.name));
    for (const mf of mediaFiles) {
      if (!existingNames.has(mf.name)) {
        allFiles.push(mf);
        existingNames.add(mf.name);
      }
    }
  }

  onProgress?.({ stage: 'indexing', message: 'Building index…', percent: 85 });

  // 3. Build category index
  const byCategory = {};
  let totalSize = 0;

  for (const file of allFiles) {
    totalSize += file.size;
    if (!byCategory[file.category]) {
      byCategory[file.category] = { files: [], totalSize: 0 };
    }
    byCategory[file.category].files.push(file);
    byCategory[file.category].totalSize += file.size;
  }

  // 4. Sort files: largest first within each category
  for (const cat of Object.values(byCategory)) {
    cat.files.sort((a, b) => b.size - a.size);
  }

  // 5. Top large files across all categories
  const largeFiles = [...allFiles]
    .sort((a, b) => b.size - a.size)
    .slice(0, 50);

  onProgress?.({ stage: 'done', message: 'Scan complete', percent: 100 });

  return {
    allFiles,
    byCategory,
    largeFiles,
    totalFiles: allFiles.length,
    totalSize,
    scannedAt: Date.now(),
  };
}

// ─────────────────────────────────────────────
//  STORAGE INFO
// ─────────────────────────────────────────────
export async function getStorageInfo() {
  try {
    const info = await RNFS.getFSInfo();
    return {
      total: info.totalSpace,
      free: info.freeSpace,
      used: info.totalSpace - info.freeSpace,
      usedPercent: Math.round(((info.totalSpace - info.freeSpace) / info.totalSpace) * 100),
    };
  } catch (e) {
    return { total: 0, free: 0, used: 0, usedPercent: 0 };
  }
}

// ─────────────────────────────────────────────
//  FILE DELETION
// ─────────────────────────────────────────────
export async function deleteFiles(files) {
  const results = { success: [], failed: [] };

  for (const file of files) {
    try {
      if (file.isFromCameraRoll) {
        await CameraRoll.deletePhotos([file.path]);
      } else {
        await RNFS.unlink(file.path);
      }
      results.success.push(file.path);
    } catch (e) {
      results.failed.push({ path: file.path, error: e.message });
    }
  }

  return results;
}
