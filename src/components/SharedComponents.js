// ─────────────────────────────────────────────
//  SHARED COMPONENTS
// ─────────────────────────────────────────────

import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated,
} from 'react-native';
import { colors, radii, spacing, typography } from '../utils/theme';
import { formatBytes } from '../utils/fileTypes';

// ── File Row ──────────────────────────────────
export function FileRow({ file, selected, onPress, onLongPress, showPath = false }) {
  const catInfo = file._catInfo || { icon: '📎', color: colors.subtext, bg: '#6B728015' };

  return (
    <TouchableOpacity
      style={[styles.fileRow, selected && styles.fileRowSelected]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={[styles.fileIcon, { backgroundColor: catInfo.bg }]}>
        <Text style={{ fontSize: 18 }}>{catInfo.icon}</Text>
      </View>

      {/* Info */}
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
        <Text style={styles.fileMeta}>
          {file.ext?.toUpperCase()} · {formatBytes(file.size)}
          {showPath ? ` · ${file.path.split('/').slice(-2, -1)[0]}` : ''}
        </Text>
      </View>

      {/* Size */}
      <Text style={styles.fileSize}>{formatBytes(file.size)}</Text>

      {/* Checkbox */}
      <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
        {selected && <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ── Storage Bar ───────────────────────────────
export function StorageBar({ storageInfo, byCategory }) {
  const segments = [
    { key: 'Videos',   color: '#4F8EF7' },
    { key: 'Photos',   color: '#22C55E' },
    { key: 'Audio',    color: '#EF4444' },
    { key: 'Documents',color: '#F59E0B' },
    { key: 'Archives', color: '#A855F7' },
    { key: 'Other',    color: '#6B7280' },
  ];

  const total = storageInfo.total || 1;

  return (
    <View style={styles.storageCard}>
      <View style={styles.storageTop}>
        <View>
          <Text style={typography.label}>STORAGE USED</Text>
          <Text style={[typography.h2, { marginTop: 2 }]}>
            {formatBytes(storageInfo.used)}
          </Text>
          <Text style={typography.caption}>
            of {formatBytes(storageInfo.total)} · {storageInfo.usedPercent}% used
          </Text>
        </View>
        <UsedBadge percent={storageInfo.usedPercent} />
      </View>

      {/* Segmented bar */}
      <View style={styles.storageBarOuter}>
        {segments.map(seg => {
          const segSize = byCategory?.[seg.key]?.totalSize || 0;
          const pct = (segSize / total) * 100;
          if (pct < 0.5) return null;
          return (
            <View
              key={seg.key}
              style={[styles.storageBarSeg, { flex: pct, backgroundColor: seg.color }]}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.storageLegend}>
        {segments.map(seg => {
          const size = byCategory?.[seg.key]?.totalSize || 0;
          if (!size) return null;
          return (
            <View key={seg.key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
              <Text style={styles.legendText}>{seg.key}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ── Used Badge ────────────────────────────────
function UsedBadge({ percent }) {
  const color = percent > 85 ? colors.danger : percent > 60 ? colors.warning : colors.success;
  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color + '40' }]}>
      <Text style={[styles.badgeText, { color }]}>{percent}%</Text>
    </View>
  );
}

// ── Primary Button ────────────────────────────
export function PrimaryButton({ title, onPress, loading, disabled, icon }) {
  return (
    <TouchableOpacity
      style={[styles.primaryBtn, (disabled || loading) && styles.primaryBtnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          {icon && <Text style={{ fontSize: 15, marginRight: 6 }}>{icon}</Text>}
          <Text style={styles.primaryBtnText}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Secondary Button ──────────────────────────
export function SecondaryButton({ title, onPress, icon }) {
  return (
    <TouchableOpacity style={styles.secondaryBtn} onPress={onPress} activeOpacity={0.7}>
      {icon && <Text style={{ fontSize: 14, marginRight: 4 }}>{icon}</Text>}
      <Text style={styles.secondaryBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

// ── Section Header ────────────────────────────
export function SectionHeader({ title, count }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {count !== undefined && (
        <Text style={styles.sectionCount}>{count}</Text>
      )}
    </View>
  );
}

// ── Empty State ───────────────────────────────
export function EmptyState({ icon = '📂', title, subtitle }) {
  return (
    <View style={styles.emptyState}>
      <Text style={{ fontSize: 48, marginBottom: spacing.md }}>{icon}</Text>
      <Text style={[typography.h4, { textAlign: 'center' }]}>{title}</Text>
      {subtitle && (
        <Text style={[typography.caption, { textAlign: 'center', marginTop: spacing.sm }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}

// ── Drive Not Installed Banner ────────────────
export function DriveNotInstalledBanner({ onInstall }) {
  return (
    <View style={styles.banner}>
      <View style={styles.bannerIcon}>
        <Text style={{ fontSize: 20 }}>⚠️</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.bodyS, { fontWeight: '600' }]}>Google Drive not found</Text>
        <Text style={[typography.caption, { marginTop: 2 }]}>
          Install Google Drive to upload files for free
        </Text>
      </View>
      <TouchableOpacity onPress={onInstall} style={styles.bannerBtn}>
        <Text style={styles.bannerBtnText}>Install</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Scan Progress Overlay ─────────────────────
export function ScanProgress({ progress }) {
  return (
    <View style={styles.scanOverlay}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={[typography.h4, { marginTop: spacing.lg }]}>
        {progress?.message || 'Scanning…'}
      </Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress?.percent || 0}%` }]} />
      </View>
      <Text style={typography.caption}>{progress?.percent || 0}%</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  // FileRow
  fileRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md, padding: spacing.sm + 2,
    marginBottom: 6, gap: spacing.sm,
    borderWidth: 1, borderColor: 'transparent',
  },
  fileRowSelected: {
    backgroundColor: colors.surface2,
    borderColor: colors.accent,
  },
  fileIcon: {
    width: 42, height: 42, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
  },
  fileInfo: { flex: 1, minWidth: 0 },
  fileName: { ...typography.bodyS, fontWeight: '500' },
  fileMeta: { ...typography.caption, marginTop: 2 },
  fileSize: { ...typography.caption, fontWeight: '500' },
  checkbox: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: colors.accent, borderColor: colors.accent },

  // Storage
  storageCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  storageTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  storageBarOuter: {
    flexDirection: 'row', height: 6, borderRadius: 3,
    overflow: 'hidden', backgroundColor: colors.surface3,
  },
  storageBarSeg: { height: '100%' },
  storageLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 10, color: colors.subtext },
  badge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: radii.sm, borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },

  // Buttons
  primaryBtn: {
    flex: 1, backgroundColor: colors.accent,
    borderRadius: radii.md, padding: 13,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  secondaryBtn: {
    paddingHorizontal: spacing.md, paddingVertical: 13,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtnText: { ...typography.bodyS, fontWeight: '500' },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700',
    color: colors.subtext, letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionCount: {
    fontSize: 11, color: colors.hint, fontWeight: '600',
  },

  // Empty state
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
  },

  // Banner
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.warning + '15',
    borderRadius: radii.md, padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.warning + '30',
  },
  bannerIcon: {
    width: 36, height: 36, borderRadius: radii.sm,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.warning + '20',
  },
  bannerBtn: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radii.sm,
  },
  bannerBtnText: { fontSize: 12, fontWeight: '700', color: colors.warning },

  // Scan overlay
  scanOverlay: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: spacing.xxl,
  },
  progressBar: {
    width: '100%', height: 4, backgroundColor: colors.surface3,
    borderRadius: 2, marginTop: spacing.lg, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
});
