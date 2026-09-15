import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../store/ThemeContext';
import principalService, { RmsMarksAuditItem } from '../services/principalService';

interface MarksAuditModalProps {
  visible: boolean;
  marksId: string | null;
  onClose: () => void;
}

export const MarksAuditModal: React.FC<MarksAuditModalProps> = ({
  visible,
  marksId,
  onClose,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [history, setHistory] = useState<RmsMarksAuditItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !marksId) return;

    let isMounted = true;
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await principalService.getMarksAuditHistory(marksId);
        if (!isMounted) return;

        let records: RmsMarksAuditItem[] = [];
        if (Array.isArray(res)) {
          records = res;
        } else if (res && Array.isArray((res as any).data)) {
          records = (res as any).data;
        }
        setHistory(records);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('[MarksAuditModal] Error fetching audit history:', err);
        setError(err?.message || 'Failed to load audit history');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [visible, marksId]);

  if (!visible || !marksId) return null;

  const styles = getStyles(theme, isDarkMode);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalCard}>
              {/* Modal Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleRow}>
                  <View style={styles.clockIconBox}>
                    <Ionicons name="time-outline" size={20} color="#7C3AED" />
                  </View>
                  <View style={styles.titleTextCol}>
                    <Text style={styles.modalTitle}>Marks Audit History</Text>
                    <Text style={styles.recordIdSubtext}>Record ID: {marksId}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeIconButton}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={20} color={theme.subtext} />
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              <View style={styles.body}>
                {isLoading ? (
                  <View style={styles.centerContainer}>
                    <ActivityIndicator size="small" color="#7C3AED" />
                    <Text style={styles.loadingText}>Loading history records...</Text>
                  </View>
                ) : error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={20} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : history.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      No audit history recorded for this entry.
                    </Text>
                  </View>
                ) : (
                  <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollListContent}>
                    {history.map((item, index) => (
                      <View key={item.id || index} style={styles.timelineItem}>
                        <View style={styles.timelineDot} />
                        {index < history.length - 1 && <View style={styles.timelineLine} />}
                        <View style={styles.historyCard}>
                          <View style={styles.historyHeader}>
                            <Text style={styles.changedByText}>
                              Changed by: {item.changed_by_name || 'System / Admin'}
                            </Text>
                            <Text style={styles.dateText}>
                              {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                            </Text>
                          </View>

                          <View style={styles.marksRow}>
                            <Text style={styles.oldMarksLabel}>
                              Old Marks: <Text style={styles.marksVal}>{item.old_marks ?? 'N/A'}</Text>
                            </Text>
                            <Ionicons name="arrow-forward" size={14} color="#7C3AED" style={{ marginHorizontal: 6 }} />
                            <Text style={styles.newMarksLabel}>
                              New Marks: <Text style={styles.newMarksVal}>{item.new_marks ?? 'N/A'}</Text>
                            </Text>
                          </View>

                          {item.change_reason ? (
                            <View style={styles.reasonBox}>
                              <Text style={styles.reasonText}>
                                Reason: &ldquo;{item.change_reason}&rdquo;
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Modal Footer */}
              <View style={styles.footer}>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeButton}
                  activeOpacity={0.8}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const getStyles = (theme: any, isDarkMode: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalCard: {
      width: '100%',
      maxWidth: 520,
      maxHeight: '80%',
      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
      borderRadius: 16,
      borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 15,
      elevation: 10,
      overflow: 'hidden',
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? '#1E293B' : '#F1F5F9',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.4)' : '#FAF9FF',
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    clockIconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDarkMode ? 'rgba(124, 58, 237, 0.15)' : '#F3E8FF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleTextCol: {
      justifyContent: 'center',
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: isDarkMode ? '#F8FAFC' : '#0F172A',
    },
    recordIdSubtext: {
      fontSize: 11,
      color: theme.subtext || '#64748B',
      marginTop: 1,
    },
    closeIconButton: {
      padding: 6,
      borderRadius: 20,
    },
    body: {
      padding: 20,
      minHeight: 180,
      justifyContent: 'center',
    },
    centerContainer: {
      paddingVertical: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 13,
      color: theme.subtext || '#64748B',
    },
    errorBox: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      borderWidth: 1,
      borderColor: isDarkMode ? '#991B1B' : '#FCA5A5',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    errorText: {
      fontSize: 13,
      fontWeight: '500',
      color: '#EF4444',
      flex: 1,
    },
    emptyContainer: {
      paddingVertical: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: theme.subtext || '#64748B',
      textAlign: 'center',
    },
    scrollList: {
      maxHeight: 340,
    },
    scrollListContent: {
      paddingLeft: 12,
    },
    timelineItem: {
      position: 'relative',
      paddingLeft: 24,
      marginBottom: 20,
    },
    timelineDot: {
      position: 'absolute',
      left: 0,
      top: 6,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#7C3AED',
      borderWidth: 2,
      borderColor: isDarkMode ? '#0F172A' : '#FFFFFF',
      zIndex: 2,
    },
    timelineLine: {
      position: 'absolute',
      left: 4,
      top: 16,
      bottom: -20,
      width: 2,
      backgroundColor: isDarkMode ? 'rgba(124, 58, 237, 0.3)' : '#DDD6FE',
      zIndex: 1,
    },
    historyCard: {
      backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.6)' : '#F8FAFC',
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    changedByText: {
      fontSize: 12,
      fontWeight: '700',
      color: isDarkMode ? '#F8FAFC' : '#0F172A',
    },
    dateText: {
      fontSize: 10,
      color: theme.subtext || '#64748B',
    },
    marksRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 4,
    },
    oldMarksLabel: {
      fontSize: 13,
      color: theme.subtext || '#64748B',
      fontWeight: '500',
    },
    marksVal: {
      fontWeight: '700',
      color: isDarkMode ? '#F8FAFC' : '#0F172A',
    },
    newMarksLabel: {
      fontSize: 13,
      color: '#7C3AED',
      fontWeight: '600',
    },
    newMarksVal: {
      fontWeight: '800',
      color: '#7C3AED',
    },
    reasonBox: {
      marginTop: 8,
      padding: 8,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
    },
    reasonText: {
      fontSize: 11,
      fontStyle: 'italic',
      color: theme.subtext || '#64748B',
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: isDarkMode ? '#1E293B' : '#F1F5F9',
      flexDirection: 'row',
      justifyContent: 'flex-end',
      backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.4)' : '#FAF9FF',
    },
    closeButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: isDarkMode ? '#334155' : '#E2E8F0',
    },
    closeButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: isDarkMode ? '#F8FAFC' : '#334155',
    },
  });

export default MarksAuditModal;
