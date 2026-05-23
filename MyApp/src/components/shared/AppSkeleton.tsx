import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from '../common/Skeleton';

/**
 * Spotify-style Entry Skeleton.
 * Simple, clean blocks that pulse gently.
 */
const AppSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Top Profile/Search Area */}
      <View style={styles.header}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <Skeleton width={120} height={20} borderRadius={4} />
      </View>

      {/* Hero Block */}
      <Skeleton width="100%" height={180} borderRadius={16} style={{ marginBottom: 32 }} />

      {/* Grid Items */}
      <View style={styles.grid}>
        <View style={styles.row}>
          <Skeleton width="48%" height={100} borderRadius={12} />
          <Skeleton width="48%" height={100} borderRadius={12} />
        </View>
        <View style={[styles.row, { marginTop: 16 }]}>
          <Skeleton width="48%" height={100} borderRadius={12} />
          <Skeleton width="48%" height={100} borderRadius={12} />
        </View>
      </View>

      {/* Bottom List items */}
      <View style={styles.list}>
        <Skeleton width="100%" height={60} borderRadius={12} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={60} borderRadius={12} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={60} borderRadius={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  grid: {
    marginBottom: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  list: {
    flex: 1,
  }
});

export default AppSkeleton;
