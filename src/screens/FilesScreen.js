// ─────────────────────────────────────────────
//  FILES SCREEN  —  Tab 1
//  Works WITHOUT photo permission.
//  Uses iOS Document Picker to let user select
//  files → FileIQ manages and uploads them.
// ─────────────────────────────────────────────

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, Alert, Modal, ActivityIndicator,
  Platform, NativeModules,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import {
  StorageBar, FileRow, SectionHeader, EmptyState,
  PrimaryButton, SecondaryButton,
} from '../components/SharedComponents';
import { sendToDrive, isDriveInstalled, openDriveApp } from '../services/DriveShare';
import { getCategoryInfo, formatBytes } from '../utils/fileTypes';
import { colors, spacing, radii, typography } from '../utils/theme';

export default function FilesScreen({ navigation }) {
  const [files, setFiles]           = useState([]);
  const [query, setQuery]           = useState('');
  const [selected, setSelected]     = useState(new Set());
  const [driveInstalled, setDriveInstalled] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [storageInfo, setStorageInfo] = useState(null);

  useEffect(() => {
    isDriveInstalled().then(ok => setDriveInstalled(ok));
    RNFS.getFSInfo().then(info => {
      setStorageInfo({
        total: info.totalSpace,
        free: info.freeSpace,
        used: info.totalSpace - info.freeSpace,
        usedPercent: Math.round(((info.totalSpace - info.freeSpace) / info.totalSpace) * 100),
      });
    }).catch(() => {});
  }, []);

  // ── Pick files using Document Picker ─────
  const pickFiles = useCallback(async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });

      const newFiles = results.map(r => ({
        name: r.name || 'Unknown',
        path: r.uri,
        size: r.size || 0,
        mtime: Date.now() / 1000,
        category: getCategoryFromName(r.name || ''),
        ext: (r.name || '').split('.').pop()?.toLowerCase() ?? '',
        _catInfo: getCategoryInfo(getCategoryFromName(r.name || '')),
        mimeType: r.type,
      }));

      setFiles(prev => {
        const existing = new Set(prev.map(f => f.path));
        const merged = [...prev];
        newFiles.forEach(f => { if (!existing.has(f.path)) merged.push(f); });
        return merged.sort((a, b) => b.size - a.size);
      });
    } catch (e) {
      if (!DocumentPicker.isCancel(e)) {
        Alert.alert('Error', 'Could not pick files');
      }
    }
  }, []);

  function getCategoryFromName(name) {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    const map = {
      mp4:'Videos', mov:'Videos', mkv:'Videos', avi:'Videos',
      jpg:'Photos', jpeg:'Photos', png:'Photos', heic:'Photos', gif:'Photos',
      mp3:'Audio', wav:'Audio', flac:'Audio', aac:'Audio',
      pdf:'PDFs', doc:'Documents', docx:'Documents', txt:'Documents',
      xls:'Spreadsheets', xlsx:'Spreadsheets', csv:'Spreadsheets',
      zip:'Archives', rar:'Archives',
    };
    return map[ext] || 'Other';
  }

  const filteredFiles = useMemo(() => {
    if (!query) return files;
    const q = query.toLowerCase().replace('.', '');
    return files.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.ext.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
    );
  }, [files, query]);

  const toggleSelect = useCallback((path) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const selectedFiles = useMemo(
    () => filteredFiles.filter(f => selected.has(f.path)),
    [filteredFiles, selected]
  );

  const selectedSize = useMemo(
    () => selectedFiles.reduce((acc, f) => acc + f.size, 0),
    [selectedFiles]
  );

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

  const handleDelete = useCallback(() => {
    if (!uploadResult?.shared?.length) return;
    Alert.alert(
      'Remove from FileIQ?',
      `Remove ${uploadResult.shared.length} file${uploadResult.shared.length > 1 ? 's' : ''} from this list?`,
      [
        { text: 'Keep', style: 'cancel', onPress: () => { setUploadModal(false); clearSelection(); }},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const uploadedPaths = new Set(uploadResult.shared.map(f => f.path));
            setFiles(prev => prev.filter(f => !uploadedPaths.has(f.path)));
            setUploadModal(false);
            clearSelection();
          },
        },
      ]
    );
  }, [uploadResult, clearSelection]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={typography.h1}>FileIQ</Text>
          <Text style={typography.caption}>
            {files.length > 0 ? `${files.length} files · ${formatBytes(files.reduce((a,f)=>a+f.size,0))}` : 'Pick files to get started'}
          </Text>
        </View>
        <TouchableOpacity onPress={pickFiles} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add Files</Text>
        </TouchableOpacity>
      </View>

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
            {storageInfo && (
              <View style={styles.storageCard}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom: 8 }}>
                  <View>
                    <Text style={typography.label}>STORAGE USED</Text>
                    <Text style={typography.h3}>{formatBytes(storageInfo.used)}</Text>
                    <Text style={typography.caption}>of {formatBytes(storageInfo.total)}</Text>
                  </View>
                  <View style={[styles.badge, { borderColor: storageInfo.usedPercent > 80 ? colors.danger+'40' : colors.warning+'40', backgroundColor: storageInfo.usedPercent > 80 ? colors.danger+'15' : colors.warning+'15' }]}>
                    <Text style={[styles.badgeText, { color: storageInfo.usedPercent > 80 ? colors.danger : colors.warning }]}>{storageInfo.usedPercent}%</Text>
                  </View>
                </View>
                <View style={styles.storageBar}>
                  <View style={[styles.storageBarFill, { width: `${storageInfo.usedPercent}%` }]} />
                </View>
              </View>
            )}

            {!driveInstalled && (
              <TouchableOpacity style={styles.banner} onPress={openDriveApp}>
                <Text style={{ fontSize: 16 }}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyS, { fontWeight:'600' }]}>Google Drive not found</Text>
                  <Text style={typography.caption}>Tap to install Google Drive</Text>
                </View>
                <Text style={styles.installBtn}>Install</Text>
              </TouchableOpacity>
            )}

            {files.length === 0 && (
              <TouchableOpacity style={styles.pickPrompt} onPress={pickFiles}>
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📂</Text>
                <Text style={[typography.h3, { textAlign:'center' }]}>Pick files to manage</Text>
                <Text style={[typography.caption, { textAlign:'center', marginTop: 8 }]}>
                  Tap to browse and select files from your iPhone
                </Text>
                <View style={[styles.addBtn, { marginTop: 20 }]}>
                  <Text style={styles.addBtnText}>+ Browse Files</Text>
                </View>
              </TouchableOpacity>
            )}

            {files.length > 0 && (
              <View style={styles.listHeader}>
                <SectionHeader title="Your Files" count={filteredFiles.length} />
                {selected.size === 0 && (
                  <TouchableOpacity onPress={() => setSelected(new Set(filteredFiles.map(f=>f.path)))}>
                    <Text style={{ fontSize:12, color: colors.accent, fontWeight:'600' }}>Select all</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <FileRow
            file={item}
            selected={selected.has(item.path)}
            onPress={() => toggleSelect(item.path)}
            onLongPress={() => toggleSelect(item.path)}
          />
        )}
        ListEmptyComponent={
          files.length > 0 ? (
            <EmptyState icon="🔍" title="No files found" subtitle={`No results for "${query}"`} />
          ) : null
        }
      />

      {selected.size > 0 && (
        <View style={styles.actionBar}>
          <SecondaryButton title="Cancel" onPress={clearSelection} />
          <PrimaryButton
            title={`Upload ${selected.size} to Drive`}
            icon="☁️"
            onPress={handleUpload}
          />
        </View>
      )}

      <Modal visible={uploadModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            {!uploadDone ? (
              <View style={{ alignItems:'center', gap: spacing.md }}>
                <ActivityIndicator color={colors.accent} size="large" />
                <Text style={typography.h4}>Opening Google Drive…</Text>
                <Text style={[typography.caption, { textAlign:'center' }]}>
                  Files will be saved to My Drive (root)
                </Text>
              </View>
            ) : (
              <View style={{ alignItems:'center', gap: spacing.sm, width:'100%' }}>
                <Text style={{ fontSize:44 }}>✅</Text>
                <Text style={typography.h3}>
                  {uploadResult?.shared?.length} file{uploadResult?.shared?.length > 1 ? 's' : ''} sent to Drive
                </Text>
                <Text style={[typography.caption, { textAlign:'center' }]}>
                  Saved to My Drive · {formatBytes(selectedSize)}
                </Text>
                <View style={styles.deletePrompt}>
                  <Text style={{ fontSize:14, fontWeight:'700', color: colors.text, marginBottom:4 }}>
                    Remove from FileIQ list?
                  </Text>
                  <Text style={[typography.caption, { textAlign:'center' }]}>
                    Files are now in Drive — remove them from this list
                  </Text>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Text style={styles.deleteBtnText}>🗑️  Remove from List</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setUploadModal(false); clearSelection(); }}>
                  <Text style={[typography.caption, { color: colors.subtext }]}>Keep in list</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor: colors.bg },
  header: {
    flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md,
  },
  addBtn: {
    backgroundColor: colors.accent, borderRadius: radii.md,
    paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  addBtnText: { color:'#fff', fontSize:13, fontWeight:'700' },
  searchBox: {
    flexDirection:'row', alignItems:'center', gap:8,
    marginHorizontal: spacing.lg, marginBottom: spacing.md,
    backgroundColor: colors.surface2, borderRadius: radii.md,
    borderWidth:1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical:10,
  },
  searchInput: { flex:1, fontSize:14, color: colors.text, padding:0 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom:100 },
  storageCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.lg, marginBottom: spacing.md,
    borderWidth:1, borderColor: colors.border,
  },
  storageBar: {
    height:6, backgroundColor: colors.surface3, borderRadius:3, overflow:'hidden',
  },
  storageBarFill: { height:'100%', backgroundColor: colors.accent, borderRadius:3 },
  badge: {
    paddingHorizontal:10, paddingVertical:4,
    borderRadius: radii.sm, borderWidth:1,
  },
  badgeText: { fontSize:11, fontWeight:'700' },
  banner: {
    flexDirection:'row', alignItems:'center', gap: spacing.sm,
    backgroundColor: colors.warning+'15', borderRadius: radii.md,
    padding: spacing.md, marginBottom: spacing.md,
    borderWidth:1, borderColor: colors.warning+'30',
  },
  installBtn: {
    fontSize:12, fontWeight:'700', color: colors.warning,
    backgroundColor: colors.warning+'20', paddingHorizontal: spacing.md,
    paddingVertical:6, borderRadius: radii.sm,
  },
  pickPrompt: {
    alignItems:'center', paddingVertical: spacing.xxl * 2,
  },
  listHeader: {
    flexDirection:'row', justifyContent:'space-between', alignItems:'center',
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  actionBar: {
    position:'absolute', bottom:0, left:0, right:0,
    flexDirection:'row', gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    borderTopWidth:1, borderTopColor: colors.border,
    paddingBottom: Platform.OS==='ios' ? 28 : spacing.lg,
  },
  modalOverlay: {
    flex:1, backgroundColor:'#00000088', justifyContent:'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface2,
    borderTopLeftRadius: radii.xl+4, borderTopRightRadius: radii.xl+4,
    padding: spacing.xl, paddingBottom:40, alignItems:'center',
  },
  modalHandle: {
    width:36, height:4, borderRadius:2,
    backgroundColor: colors.border, marginBottom: spacing.lg,
  },
  deletePrompt: {
    backgroundColor: colors.danger+'12', borderRadius: radii.md,
    borderWidth:1, borderColor: colors.danger+'25',
    padding: spacing.md, width:'100%', alignItems:'center', marginTop: spacing.md,
  },
  deleteBtn: {
    backgroundColor: colors.danger+'20', borderRadius: radii.md,
    padding:14, alignItems:'center', width:'100%',
    borderWidth:1, borderColor: colors.danger+'40', marginTop: spacing.sm,
  },
  deleteBtnText: { color: colors.danger, fontWeight:'700', fontSize:14 },
});