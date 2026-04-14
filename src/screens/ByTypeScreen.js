// ─────────────────────────────────────────────
//  BY TYPE SCREEN  —  Tab 2
//  Grid of file categories. Tap to see all
//  files of that type. Search by format (.mp4).
// ─────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useScanContext } from '../context/ScanContext';
import { ScanProgress, EmptyState } from '../components/SharedComponents';
import { FILE_CATEGORIES, getCategoryInfo, formatBytes, EXT_MAP } from '../utils/fileTypes';
import { colors, spacing, radii, typography } from '../utils/theme';

// ─────────────────────────────────────────────
export default function ByTypeScreen({ navigation }) {
  const { scanData, isScanning, scanProgress } = useScanContext();
  const [query, setQuery] = useState('');

  // ── Smart search ──────────────────────────
  //  ".mp4" or "mp4" → jump straight to Videos
  //  "video"         → jump to Videos card
  //  "pdf"           → jump to PDFs
  const resolvedCategory = useMemo(() => {
    if (!query) return null;
    const clean = query.toLowerCase().replace(/^\./, '');
    // Exact extension match
    const byExt = EXT_MAP[clean];
    if (byExt) return byExt;
    // Category name partial match
    const byName = Object.keys(FILE_CATEGORIES).find(
      k => k.toLowerCase().includes(clean) ||
           FILE_CATEGORIES[k].label.toLowerCase().includes(clean)
    );
    return byName || null;
  }, [query]);

  // ── Category cards ────────────────────────
  const categories = useMemo(() => {
    if (!scanData?.byCategory) return [];
    const total = scanData.totalSize || 1;

    return Object.keys(FILE_CATEGORIES)
      .filter(key => {
        // Only show categories that have files
        const cat = scanData.byCategory[key];
        if (!cat?.files?.length) return false;
        // Filter by search
        if (!query) return true;
        if (resolvedCategory) return key === resolvedCategory;
        return key.toLowerCase().includes(query.toLowerCase());
      })
      .map(key => {
        const cat = scanData.byCategory[key];
        const info = getCategoryInfo(key);
        const pct = Math.round((cat.totalSize / total) * 100);
        const formats = [...new Set(cat.files.map(f => f.ext?.toUpperCase()).filter(Boolean))];
        return {
          key,
          info,
          count: cat.files.length,
          totalSize: cat.totalSize,
          pct,
          formats: formats.slice(0, 4), // preview up to 4 formats
        };
      })
      .sort((a, b) => b.totalSize - a.totalSize); // largest first
  }, [scanData, query, resolvedCategory]);

  // ─────────────────────────────────────────
  if (isScanning) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={typography.h1}>By Type</Text>
        </View>
        <ScanProgress progress={scanProgress} />
      </SafeAreaView>
    );
  }

  const renderCard = ({ item: cat }) => (
    <TouchableOpacity
      style={[styles.card, resolvedCategory === cat.key && styles.cardHighlighted]}
      onPress={() => navigation.navigate('TypeDetail', { categoryKey: cat.key })}
      activeOpacity={0.7}
    >
      {/* Icon + name */}
      <View style={styles.cardTop}>
        <View style={[styles.iconWrap, { backgroundColor: cat.info.bg }]}>
          <Text style={{ fontSize: 22 }}>{cat.info.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{cat.info.label}</Text>
          <Text style={styles.cardMeta}>
            {cat.count.toLocaleString()} files
          </Text>
        </View>
        <Text style={styles.cardSize}>{formatBytes(cat.totalSize)}</Text>
      </View>

      {/* Storage bar */}
      <View style={styles.cardBar}>
        <View style={[styles.cardBarFill, { width: `${Math.max(cat.pct, 2)}%`, backgroundColor: cat.info.color }]} />
      </View>

      {/* Format pills */}
      <View style={styles.formatPills}>
        {cat.formats.map(fmt => (
          <View key={fmt} style={[styles.pill, { borderColor: cat.info.color + '50' }]}>
            <Text style={[styles.pillText, { color: cat.info.color }]}>
              .{fmt.toLowerCase()}
            </Text>
          </View>
        ))}
        {cat.count > 4 && (
          <Text style={styles.morePills}>+more</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={typography.h1}>By Type</Text>
        <Text style={[typography.caption, { marginTop: 2 }]}>
          Browse your files by format
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={{ fontSize: 14, color: colors.subtext }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Type .mp4, pdf, video, audio…"
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

      {/* Format match indicator */}
      {query.length > 0 && resolvedCategory && (
        <View style={styles.matchBanner}>
          <Text style={styles.matchText}>
            Showing: {getCategoryInfo(resolvedCategory).icon} {getCategoryInfo(resolvedCategory).label}
          </Text>
        </View>
      )}

      <FlatList
        data={categories}
        keyExtractor={item => item.key}
        renderItem={renderCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        numColumns={1}
        ListEmptyComponent={
          <EmptyState
            icon="📂"
            title="No categories found"
            subtitle={query ? `No files match "${query}"` : 'Scan your device first'}
          />
        }
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: colors.surface2, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, padding: 0 },

  matchBanner: {
    marginHorizontal: spacing.lg, marginBottom: spacing.sm,
    backgroundColor: colors.accent + '15', borderRadius: radii.sm,
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.accent + '30',
  },
  matchText: { fontSize: 12, color: colors.accent, fontWeight: '600' },

  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 100 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg, padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
    gap: spacing.sm,
  },
  cardHighlighted: {
    borderColor: colors.accent,
    backgroundColor: colors.surface2,
  },
  cardTop: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: radii.md,
    alignItems: 'center', justifyContent: 'center',
  },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 11, color: colors.subtext, marginTop: 1 },
  cardSize: { fontSize: 13, fontWeight: '600', color: colors.text },

  cardBar: {
    height: 4, backgroundColor: colors.surface3,
    borderRadius: 2, overflow: 'hidden',
  },
  cardBarFill: { height: '100%', borderRadius: 2 },

  formatPills: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radii.full, borderWidth: 1,
    backgroundColor: 'transparent',
  },
  pillText: { fontSize: 10, fontWeight: '600' },
  morePills: { fontSize: 10, color: colors.hint, alignSelf: 'center' },
});
