// ─────────────────────────────────────────────
//  FILE TYPE DEFINITIONS
//  Maps every known extension → category
// ─────────────────────────────────────────────

export const FILE_CATEGORIES = {
  Videos: {
    label: 'Videos',
    icon: '🎬',
    color: '#4F8EF7',
    bg: '#4F8EF715',
    extensions: ['mp4', 'mov', 'mkv', 'avi', 'wmv', 'm4v', '3gp', 'flv', 'webm', 'mpg', 'mpeg', 'ts'],
  },
  Photos: {
    label: 'Photos',
    icon: '📸',
    color: '#22C55E',
    bg: '#22C55E15',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'heic', 'heif', 'tiff', 'tif', 'svg'],
  },
  RAW: {
    label: 'RAW',
    icon: '🖼️',
    color: '#A855F7',
    bg: '#A855F715',
    extensions: ['cr2', 'cr3', 'nef', 'arw', 'orf', 'rw2', 'dng', 'raw', 'pef', 'srw'],
  },
  Audio: {
    label: 'Audio',
    icon: '🎵',
    color: '#EF4444',
    bg: '#EF444415',
    extensions: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma', 'opus', 'aiff', 'amr'],
  },
  PDFs: {
    label: 'PDFs',
    icon: '📄',
    color: '#F59E0B',
    bg: '#F59E0B15',
    extensions: ['pdf'],
  },
  Documents: {
    label: 'Documents',
    icon: '📝',
    color: '#3B82F6',
    bg: '#3B82F615',
    extensions: ['doc', 'docx', 'odt', 'rtf', 'txt', 'pages', 'md', 'tex'],
  },
  Spreadsheets: {
    label: 'Spreadsheets',
    icon: '📊',
    color: '#10B981',
    bg: '#10B98115',
    extensions: ['xls', 'xlsx', 'csv', 'ods', 'numbers'],
  },
  Presentations: {
    label: 'Slides',
    icon: '📑',
    color: '#F97316',
    bg: '#F9731615',
    extensions: ['ppt', 'pptx', 'odp', 'key'],
  },
  Archives: {
    label: 'Archives',
    icon: '🗜️',
    color: '#8B5CF6',
    bg: '#8B5CF615',
    extensions: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso', 'tar.gz'],
  },
  Apps: {
    label: 'Apps',
    icon: '📦',
    color: '#EC4899',
    bg: '#EC489915',
    extensions: ['ipa', 'apk', 'xapk'],
  },
  Code: {
    label: 'Code',
    icon: '💻',
    color: '#06B6D4',
    bg: '#06B6D415',
    extensions: ['js', 'ts', 'py', 'swift', 'kt', 'java', 'c', 'cpp', 'h', 'html', 'css', 'json', 'xml', 'yml', 'yaml', 'sh'],
  },
  Other: {
    label: 'Other',
    icon: '📎',
    color: '#6B7280',
    bg: '#6B728015',
    extensions: [],
  },
};

// Flat lookup: extension → category key
export const EXT_MAP = {};
Object.entries(FILE_CATEGORIES).forEach(([key, cat]) => {
  cat.extensions.forEach(ext => {
    EXT_MAP[ext.toLowerCase()] = key;
  });
});

export function getCategoryForFile(filename) {
  if (!filename) return 'Other';
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXT_MAP[ext] || 'Other';
}

export function getCategoryInfo(categoryKey) {
  return FILE_CATEGORIES[categoryKey] || FILE_CATEGORIES.Other;
}

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}
