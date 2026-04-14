// ─────────────────────────────────────────────
//  TYPE DETAIL SCREEN
//  Shows all files of one category.
//  Filter by sub-format. Select & upload.
// ─────────────────────────────────────────────

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, Modal, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useScanContext } from '../context/ScanContext';
import {
  FileRow, SectionHeader, EmptyState,
  PrimaryButton, SecondaryButton,
} from '../components/SharedComponents';
import { sendToDrive } from '../services/DriveShare';
import { deleteFiles } from '../services/FileScanner';
import { getCategoryInfo, formatBytes } from '../utils/fileTypes';
import { colors, spacing, radii, typography } from '../utils/theme';

// ─────────────────────────────────────────────
export default function TypeDetailScreen({ route, navigation }) {
  const { categoryKey } = route.params;
  const { scanData } = useScanContext();
  const catInfo = getCategoryInfo(categoryKey);
  const catData = scanData?.byCategory?.[categoryKey];

  const [activeExt, setActiveExt]   = useState('All');
  const [selected, setSelected]     = useState(new Set());
  const [sortBy, setSortBy]         = useState('size'); // size | date | name
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // ── Available formats ─────────────────────
  const formats = useMemo(() => {
    if (!catData?.files) return ['All'];
    const exts = [...new Set(catData.files.map(f => f.ext?.toUpperCase()).filter(Boolean))].sort();
    return ['All', ...exts];
  }, [catData]);

  // ── Filtered + sorted files ───────────────
  const files = useMemo(() => {
    if (!catData?.files) return [];
    let list = catData.files;

    if (activeExt !== 'All') {
      list = list.filter(f => f.ext?.toUpperCase() === activeExt);
    }

    const catInfoObj = catInfo;
    list = [...list].sort((a, b) => {
      if (sortBy === 'size')  return b.size - a.size;
      if (sortBy === 'date')  return b.mtime - a.mtime;
      if (sortBy === 'name')  return a.name.localeCompare(b.name);
      return 0;
    });

    return list.map(f => ({ ...f, _catInfo: catInfoObj }));
  }, [catData, activeExt, sortBy, catInfo]);

  const totalFilteredSize = useMemo(
    () => files.reduce((acc, f) => acc + f.size, 0),
    [files]
  );

  // ── Selection ─────────────────────────────
  const toggleSelect = useCallback((path) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => setSelected(new Set(files.map(f => f.path))), [files]);
  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const selectedFiles = useMemo(
    () => files.filter(f => selected.has(f.path)),
    [files, selected]
  );
  const selectedSize = useMemo(
    () => selectedFiles.reduce((acc, f) => acc + f.size, 0),
    [selectedFiles]
  );

  // ── Upload ────────────────────────────────
  const handleUpload = useCallback(async () => {
    if (!selectedFiles.length) return;
    setUploadModal(true);
    setUploadDone(false);

    try {
      const result = await sendToDrive(selectedFiles, () => {});
      setUploadResult(result);
      setUploadDone(true);
    } catch (e) {
      setUploadModal(false);
      Alert.alert('Upload Failed', e.message);
    }
  }, [selectedFiles]);

  // ── Delete after upload ───────────────────
  const handleDelete = useCallback(() => {
    if (!uploadResult?.shared?.length) return;
    Alert.alert(
      'Delete from Phone?',
      `Remove ${uploadResult.shared.length} files from this device?\n\nThey are safely in your Google Drive.`,
      [
        { text: 'Keep', style: 'cancel', onPress: () => { setUploadModal(false); clearSelection(); } },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setUploadModal(false);
            await deleteFiles(uploadResult.shared);
            clearSelection();
            Alert.alert('Done', `${formatBytes(selectedSize)} freed from your phone.`);
          },
        },
      ]
    );
  }, [uploadResult, clearSelection, selectedSize]);

  // ─────────────────────────────────────────
  if (!catData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState icon="📂" title="No files found" subtitle="This category is empty" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 20, color: colors.accent }}>‹</Text>
        </TouchableOpacity>
        <View style={[styles.headerIcon, { backgroundColor: catInfo.bg }]}>
          <Text style={{ fontSize: 20 }}>{catInfo.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={typography.h3}>{catInfo.label}</Text>
          <Text style={typography.caption}>
            {files.length.toLocaleString()} files · {formatBytes(totalFilteredSize)}
          </Text>
        </View>
      </View>

      {/* Format filter pills */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.pillScroll}
        contentContainerStyle={styles.pillContainer}
      >
        {formats.map(fmt => (
          <TouchableOpacity
            key={fmt}
            style={[
              styles.pill,
              activeExt === fmt && { backgroundColor: catInfo.color + '25', borderColor: catInfo.color + '60' },
            ]}
            onPress={() => { setActiveExt(fmt); clearSelection(); }}
          >
            <Text style={[
              styles.pillText,
              activeExt === fmt && { color: catInfo.color },
            ]}>
              {fmt === 'All' ? 'All' : `.${fmt.toLowerCase()}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort bar */}
      <View style={styles.sortBar}>
        <Text style={typography.caption}>Sort by:</Text>
        {['size', 'date', 'name'].map(s => (
          <TouchableOpacity
            key={s}
            onPress={() => setSortBy(s)}
            style={[styles.sortBtn, sortBy === s && styles.sortBtnActive]}
          >
            <Text style={[styles.sortText, sortBy === s && { color: colors.accent }]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={{ flex: 1 }} />
        {selected.size === 0 ? (
          <TouchableOpacity onPress={selectAll}>
            <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '600' }}>
              Select all
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={clearSelection}>
            <Text style={{ fontSize: 12, color: colors.subtext }}>Deselect</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* File list */}
      <FlashList
        data={files}
        keyExtractor={item => item.path}
        estimatedItemSize={62}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <FileRow
            file={item}
            selected={selected.has(item.path)}
            onPress={() => toggleSelect(item.path)}
            onLongPress={() => toggleSelect(item.path)}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon={catInfo.icon}
            title="No files"
            subtitle={`No ${catInfo.label.toLowerCase()} with .${activeExt.toLowerCase()} format`}
          />
        }
      />

      {/* Action bar */}
      {selected.size > 0 && (
        <View style={styles.actionBar}>
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>
              {selected.size} selected
            </Text>
            <Text style={styles.selectionSize}>
              {formatBytes(selectedSize)}
            </Text>
          </View>
          <View style={styles.actionBtns}>
            <SecondaryButton title="Cancel" onPress={clearSelection} />
            <PrimaryButton
              title="Upload to Drive"
              icon="☁️"
              onPress={handleUpload}
            />
          </View>
        </View>
      )}

      {/* Upload Modal */}
      <Modal visible={uploadModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {!uploadDone ? (
              <View style={{ alignItems: 'center', gap: spacing.md }}>
                <ActivityIndicator color={colors.accent} size="large" />
                <Text style={typography.h4}>Opening Google Drive…</Text>
                <Text style={[typography.caption, { textAlign: 'center' }]}>
                  Your files will be saved to My Drive (root)
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', gap: spacing.sm, width: '100%' }}>
                <Text style={{ fontSize: 44 }}>✅</Text>
                <Text style={typography.h3}>
                  {uploadResult?.shared?.length} file{uploadResult?.shared?.length > 1 ? 's' : ''} in Drive
                </Text>
                <Text style={[typography.caption, { textAlign: 'center' }]}>
                  Saved to My Drive · {formatBytes(selectedSize)}
                </Text>

                <View style={[styles.deletePrompt, { marginTop: spacing.md }]}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4 }}>
                    Free up {formatBytes(selectedSize)}?
                  </Text>
                  <Text style={[typography.caption, { textAlign: 'center' }]}>
                    Delete these files from your phone since they're now in Drive
                  </Text>
                </View>

                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Text style={styles.deleteBtnText}>🗑️  Delete from Phone</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setUploadModal(false); clearSelection(); }}
                >
                  <Text style={[typography.caption, { color: colors.subtext }]}>
                    Keep on phone
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md,
  },
  backBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: radii.md,
    alignItems: 'center', justifyContent: 'center',
  },

  pillScroll: { maxHeight: 44, flexGrow: 0 },
  pillContainer: {
    paddingHorizontal: spacing.lg, gap: 8, paddingVertical: 6,
  },
  pill: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: radii.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  pillText: { fontSize: 12, fontWeight: '600', color: colors.subtext },

  sortBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: 8,
  },
  sortBtn: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  sortBtnActive: { backgroundColor: colors.accent + '20' },
  sortText: { fontSize: 12, fontWeight: '600', color: colors.subtext },

  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 120 },

  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border,
    padding: spacing.lg, paddingBottom: Platform.OS === 'ios' ? 28 : spacing.lg,
    gap: spacing.sm,
  },
  selectionInfo: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  selectionCount: { fontSize: 13, fontWeight: '700', color: colors.text },
  selectionSize: { fontSize: 12, color: colors.subtext },
  actionBtns: { flexDirection: 'row', gap: spacing.sm },

  modalOverlay: {
    flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface2,
    borderTopLeftRadius: radii.xl + 4, borderTopRightRadius: radii.xl + 4,
    padding: spacing.xl, paddingBottom: 40, alignItems: 'center',
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border, marginBottom: spacing.lg,
  },
  deletePrompt: {
    backgroundColor: colors.danger + '12', borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.danger + '25',
    padding: spacing.md, width: '100%', alignItems: 'center',
  },
  deleteBtn: {
    backgroundColor: colors.danger + '20', borderRadius: radii.md,
    padding: 14, alignItems: 'center', width: '100%',
    borderWidth: 1, borderColor: colors.danger + '40',
    marginTop: spacing.sm,
  },
  deleteBtnText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
});
