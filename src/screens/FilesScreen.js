// ─────────────────────────────────────────────
//  FILES SCREEN  —  Tab 1
//  Directory-style file manager.
//  Shows storage overview, folders & large files.
//  Select files → send to Google Drive.
// ─────────────────────────────────────────────

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, Alert, Modal, ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScanContext } from '../context/ScanContext';
import {
  StorageBar, FileRow, SectionHeader, EmptyState,
  PrimaryButton, SecondaryButton, DriveNotInstalledBanner, ScanProgress,
} from '../components/SharedComponents';
import { sendToDrive, isDriveInstalled, openDriveApp } from '../services/DriveShare';
import { deleteFiles } from '../services/FileScanner';
import { getCategoryInfo, formatBytes } from '../utils/fileTypes';
import { colors, spacing, radii, typography } from '../utils/theme';

// ─────────────────────────────────────────────
export default function FilesScreen({ navigation }) {
  const { scanData, storageInfo, scanProgress, isScanning, rescan } = useScanContext();

  const [query, setQuery]           = useState('');
  const [selected, setSelected]     = useState(new Set());
  const [driveInstalled, setDriveInstalled] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadStage, setUploadStage] = useState('');
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // ── Check Drive on mount ──────────────────
  React.useEffect(() => {
    isDriveInstalled().then(ok => setDriveInstalled(ok));
  }, []);

  // ── Filtered large files ──────────────────
  const filteredFiles = useMemo(() => {
    if (!scanData?.largeFiles) return [];
    const catInfo = {};
    const q = query.toLowerCase();
    return scanData.largeFiles
      .filter(f => {
        if (!q) return true;
        return (
          f.name.toLowerCase().includes(q) ||
          f.ext.toLowerCase().includes(q.replace('.', '')) ||
          f.category.toLowerCase().includes(q)
        );
      })
      .map(f => {
        if (!catInfo[f.category]) catInfo[f.category] = getCategoryInfo(f.category);
        return { ...f, _catInfo: catInfo[f.category] };
      });
  }, [scanData?.largeFiles, query]);

  // ── Selection ─────────────────────────────
  const toggleSelect = useCallback((path) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(filteredFiles.map(f => f.path)));
  }, [filteredFiles]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const selectedFiles = useMemo(() => {
    return filteredFiles.filter(f => selected.has(f.path));
  }, [filteredFiles, selected]);

  const selectedTotalSize = useMemo(() => {
    return selectedFiles.reduce((acc, f) => acc + f.size, 0);
  }, [selectedFiles]);

  // ── Upload to Drive ───────────────────────
  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    setUploadModal(true);
    setUploadDone(false);
    setUploadResult(null);

    try {
      const result = await sendToDrive(selectedFiles, (prog) => {
        setUploadStage(prog.stage);
        setUploadProgress({ current: prog.current, total: prog.total });
      });

      setUploadResult(result);
      setUploadDone(true);
    } catch (e) {
      setUploadModal(false);
      Alert.alert('Upload Failed', e.message);
    }
  }, [selectedFiles]);

  // ── Delete after upload ───────────────────
  const handleDeleteAfterUpload = useCallback(async () => {
    if (!uploadResult?.shared?.length) return;

    Alert.alert(
      'Delete from Phone?',
      `Remove ${uploadResult.shared.length} file${uploadResult.shared.length > 1 ? 's' : ''} from this device?\n\nThey are now safely in your Google Drive.`,
      [
        { text: 'Keep on Phone', style: 'cancel', onPress: () => { setUploadModal(false); clearSelection(); } },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setUploadModal(false);
            const res = await deleteFiles(uploadResult.shared);
            clearSelection();
            rescan();
            Alert.alert(
              'Done',
              `${res.success.length} file${res.success.length > 1 ? 's' : ''} deleted from your phone.\n${formatBytes(selectedTotalSize)} freed.`
            );
          },
        },
      ]
    );
  }, [uploadResult, clearSelection, rescan, selectedTotalSize]);

  // ── Folder summary cards ──────────────────
  const folderCards = useMemo(() => {
    if (!scanData?.byCategory) return [];
    return Object.entries(scanData.byCategory)
      .sort((a, b) => b[1].totalSize - a[1].totalSize)
      .slice(0, 6)
      .map(([key, val]) => ({
        key,
        info: getCategoryInfo(key),
        count: val.files.length,
        size: val.totalSize,
      }));
  }, [scanData]);

  // ─────────────────────────────────────────
  if (isScanning) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={typography.h1}>FileIQ</Text>
        </View>
        <ScanProgress progress={scanProgress} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={typography.h1}>FileIQ</Text>
          {scanData && (
            <Text style={typography.caption}>
              {scanData.totalFiles.toLocaleString()} files indexed
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={rescan} style={styles.refreshBtn}>
          <Text style={{ fontSize: 18 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={{ fontSize: 14, color: colors.subtext }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search files or type .mp4, .pdf…"
          placeholderTextColor={colors.hint}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={{ fontSize: 14, color: colors.subtext }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredFiles}
        keyExtractor={item => item.path}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Drive not installed warning */}
            {!driveInstalled && (
              <DriveNotInstalledBanner onInstall={openDriveApp} />
            )}

            {/* Storage overview */}
            {storageInfo && scanData && (
              <StorageBar storageInfo={storageInfo} byCategory={scanData.byCategory} />
            )}

            {/* Folder tiles */}
            {folderCards.length > 0 && !query && (
              <>
                <SectionHeader title="Categories" count={folderCards.length} />
                <View style={styles.folderGrid}>
                  {folderCards.map(cat => (
                    <TouchableOpacity
                      key={cat.key}
                      style={styles.folderTile}
                      onPress={() => navigation.navigate('TypeDetail', { categoryKey: cat.key })}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 24 }}>{cat.info.icon}</Text>
                      <Text style={styles.folderName}>{cat.info.label}</Text>
                      <Text style={styles.folderMeta}>
                        {cat.count} files · {formatBytes(cat.size)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Large files header */}
            <View style={styles.largeFilesHeader}>
              <SectionHeader
                title={query ? `Results for "${query}"` : 'Large Files'}
                count={filteredFiles.length}
              />
              {filteredFiles.length > 0 && selected.size === 0 && (
                <TouchableOpacity onPress={selectAll}>
                  <Text style={styles.selectAllText}>Select all</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        }
        renderItem={({ item }) => (
          <FileRow
            file={item}
            selected={selected.has(item.path)}
            onPress={() => toggleSelect(item.path)}
            onLongPress={() => toggleSelect(item.path)}
            showPath
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="🔍"
            title={query ? 'No files found' : 'No files indexed'}
            subtitle={query ? `No results for "${query}"` : 'Tap refresh to scan your device'}
          />
        }
      />

      {/* Action bar — appears when files selected */}
      {selected.size > 0 && (
        <View style={styles.actionBar}>
          <SecondaryButton title="Cancel" onPress={clearSelection} />
          <PrimaryButton
            title={`Upload ${selected.size} file${selected.size > 1 ? 's' : ''} to Drive`}
            icon="☁️"
            onPress={handleUpload}
          />
        </View>
      )}

      {/* Upload Modal */}
      <Modal visible={uploadModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {!uploadDone ? (
              <>
                <Text style={[typography.h3, { marginBottom: spacing.sm }]}>
                  Sending to Google Drive
                </Text>
                <Text style={[typography.caption, { marginBottom: spacing.lg }]}>
                  Files will be saved to the root of your Drive (My Drive)
                </Text>
                <ActivityIndicator color={colors.accent} size="large" />
                <Text style={[typography.bodyS, { marginTop: spacing.lg, textAlign: 'center' }]}>
                  {uploadStage === 'preparing'
                    ? `Preparing ${uploadProgress.current} of ${uploadProgress.total}…`
                    : 'Opening Google Drive…'}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ fontSize: 48, marginBottom: spacing.md }}>✅</Text>
                <Text style={typography.h3}>
                  {uploadResult?.shared?.length} file{uploadResult?.shared?.length > 1 ? 's' : ''} sent to Drive
                </Text>
                <Text style={[typography.caption, { marginTop: spacing.sm, textAlign: 'center' }]}>
                  {formatBytes(selectedTotalSize)} saved to My Drive (root folder)
                </Text>

                <View style={styles.deletePrompt}>
                  <Text style={[typography.bodyS, { fontWeight: '600', marginBottom: 4 }]}>
                    Free up space on your phone?
                  </Text>
                  <Text style={typography.caption}>
                    Remove these files from device to reclaim {formatBytes(selectedTotalSize)}
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDeleteAfterUpload}
                  >
                    <Text style={styles.deleteBtnText}>🗑️  Delete from Phone</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.keepBtn}
                    onPress={() => { setUploadModal(false); clearSelection(); }}
                  >
                    <Text style={styles.keepBtnText}>Keep on Phone</Text>
                  </TouchableOpacity>
                </View>
              </>
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md,
  },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
  },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.surface2, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: colors.text, padding: 0,
  },

  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },

  folderGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.sm,
  },
  folderTile: {
    width: '30%', backgroundColor: colors.surface,
    borderRadius: radii.lg, padding: spacing.md,
    borderWidth: 1, borderColor: colors.border,
    gap: 4,
  },
  folderName: { fontSize: 12, fontWeight: '600', color: colors.text },
  folderMeta: { fontSize: 10, color: colors.subtext },

  largeFilesHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  selectAllText: { fontSize: 12, color: colors.accent, fontWeight: '600' },

  // Action bar
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? 28 : spacing.lg,
  },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface2,
    borderTopLeftRadius: radii.xl + 4,
    borderTopRightRadius: radii.xl + 4,
    padding: spacing.xl,
    paddingBottom: 36,
    alignItems: 'center',
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border, marginBottom: spacing.lg,
  },

  deletePrompt: {
    backgroundColor: colors.danger + '15',
    borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.danger + '30',
    padding: spacing.md, marginTop: spacing.lg,
    width: '100%', alignItems: 'center',
  },
  modalActions: { width: '100%', gap: spacing.sm, marginTop: spacing.lg },
  deleteBtn: {
    backgroundColor: colors.danger + '20',
    borderRadius: radii.md, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: colors.danger + '40',
  },
  deleteBtnText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
  keepBtn: {
    backgroundColor: colors.surface3,
    borderRadius: radii.md, padding: 14, alignItems: 'center',
  },
  keepBtnText: { color: colors.subtext, fontWeight: '500', fontSize: 14 },
});
