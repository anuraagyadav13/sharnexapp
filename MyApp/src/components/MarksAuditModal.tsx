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
import { withAlpha } from '../constants/theme';
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
                    <Ionicons name="time-outline" size={20} color={theme.primary} />
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
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={styles.loadingText}>Loading history records...</Text>
                  </View>
                ) : error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={20} color={theme.danger} />
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
                            <Ionicons name="arrow-forward" size={14} color={theme.primary} style={{ marginHorizontal: 6 }} />
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
      backgroundColor: withAlpha(theme.overlay, 0.6),
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalCard: {
      width: '100%',
      maxWidth: 520,
      maxHeight: '80%',
      backgroundColor: theme.surface,
      borderRadius: 16,
      borderColor: theme.border,
      borderWidth: 1,
      shadowColor: theme.shadow,
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
      borderBottomColor: theme.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: withAlpha(theme.primary, 0.05),
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
      backgroundColor: withAlpha(theme.primary, 0.15),
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleTextCol: {
      justifyContent: 'center',
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    recordIdSubtext: {
      fontSize: 11,
      color: theme.subtext,
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
      color: theme.subtext,
    },
    errorBox: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: withAlpha(theme.danger, 0.15),
      borderWidth: 1,
      borderColor: withAlpha(theme.danger, 0.4),
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    errorText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.danger,
      flex: 1,
    },
    emptyContainer: {
      paddingVertical: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: theme.subtext,
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
      backgroundColor: theme.primary,
      borderWidth: 2,
      borderColor: theme.surface,
      zIndex: 2,
    },
    timelineLine: {
      position: 'absolute',
      left: 4,
      top: 16,
      bottom: -20,
      width: 2,
      backgroundColor: withAlpha(theme.primary, 0.3),
      zIndex: 1,
    },
    historyCard: {
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.border,
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
      color: theme.text,
    },
    dateText: {
      fontSize: 10,
      color: theme.subtext,
    },
    marksRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 4,
    },
    oldMarksLabel: {
      fontSize: 13,
      color: theme.subtext,
      fontWeight: '500',
    },
    marksVal: {
      fontWeight: '700',
      color: theme.text,
    },
    newMarksLabel: {
      fontSize: 13,
      color: theme.primary,
      fontWeight: '600',
    },
    newMarksVal: {
      fontWeight: '800',
      color: theme.primary,
    },
    reasonBox: {
      marginTop: 8,
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
    },
    reasonText: {
      fontSize: 11,
      fontStyle: 'italic',
      color: theme.subtext,
    },
    footer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      backgroundColor: withAlpha(theme.primary, 0.05),
    },
    closeButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: withAlpha(theme.primary, 0.2),
    },
    closeButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.text,
    },
  });

export default MarksAuditModal;
