import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StudentHeader } from '../../components/StudentHeader';
import messageService from '../../services/messageService';
import { getStoredTokens } from '../../services/apiClient';
import { API_BASE_URL, ENDPOINTS } from '../../constants/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

class SimpleEventSource {
  private xhr: XMLHttpRequest | null = null;
  private url: string;
  private headers: Record<string, string>;
  onmessage?: (event: { data: string }) => void;
  onerror?: (error: any) => void;

  constructor(url: string, headers: Record<string, string> = {}) {
    this.url = url;
    this.headers = headers;
    this.connect();
  }

  private connect() {
    const xhr = new XMLHttpRequest();
    this.xhr = xhr;
    xhr.open('GET', this.url, true);

    // Set headers
    for (const [key, val] of Object.entries(this.headers)) {
      xhr.setRequestHeader(key, val);
    }
    xhr.setRequestHeader('Accept', 'text/event-stream');

    let seenBytes = 0;
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 3 || xhr.readyState === 4) {
        const text = xhr.responseText || '';
        const chunk = text.substring(seenBytes);
        seenBytes = text.length;
        if (chunk) {
          this.parseChunk(chunk);
        }
      }
      if (xhr.readyState === 4) {
        // Reconnect after delay if not closed
        if (this.xhr === xhr) {
          setTimeout(() => this.connect(), 3000);
        }
      }
    };

    xhr.onerror = (err) => {
      if (this.onerror) this.onerror(err);
      if (this.xhr === xhr) {
        setTimeout(() => this.connect(), 5000);
      }
    };

    xhr.send();
  }

  private parseChunk(chunk: string) {
    const lines = chunk.split('\n');
    let dataBuffer = '';
    for (const line of lines) {
      if (line.startsWith('data:')) {
        dataBuffer += line.substring(5).trim();
      } else if (line.trim() === '' && dataBuffer) {
        if (this.onmessage) {
          this.onmessage({ data: dataBuffer });
        }
        dataBuffer = '';
      }
    }
  }

  close() {
    if (this.xhr) {
      const tempXhr = this.xhr;
      this.xhr = null;
      tempXhr.abort();
    }
  }
}

const EventSource = SimpleEventSource;
const USE_SSE = true; // flip to false to disable the live stream without touching other logic

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
  createdAt?: string;
  clientMessageId?: string;
  status?: 'sending' | 'sent' | 'failed';
}

interface Conversation {
  id: string; // = partnerId
  name: string;
  roleOrClass: string;
  initials: string;
  avatarColor: string;
  lastMessageTime: string;
  unreadCount: number;
  lastMessage?: {
    id: string;
    senderId: string;
    content: string;
    isRead: boolean;
    createdAt: string;
  } | null;
  messages: Message[];
  hasMoreMessages: boolean;
  messagesLoaded: boolean;
}

interface Contact {
  id: string;
  studentId: string;
  name: string;
  email: string;
  rollNo: string;
  className: string;
}

const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColor = (id: string) => {
  const colors = ['#F97316', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const formatTime = (isoString: string) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
};

// RFC-compliant pure JS UUID generator
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const roleOrClassFor = (partnerId: string, partnerRole: string, contactsById: Map<string, Contact>) => {
  const contact = contactsById.get(partnerId);
  if (contact?.className || contact?.rollNo) {
    const cls = contact.className ? `Class ${contact.className}` : '';
    const roll = contact.rollNo ? `Roll ${contact.rollNo}` : '';
    return [cls, roll].filter(Boolean).join(', ');
  }
  // Fallback: partnerRole is just "STUDENT"/"TEACHER", not roll/class info,
  // but it's better than showing nothing if contacts haven't loaded/matched yet.
  return partnerRole || '';
};

const Messages = () => {
  const { authState } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [streamConnected, setStreamConnected] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const currentUserId = authState.user?.id;

  // ---------------------------------------------------------------------
  // Conversations list
  // ---------------------------------------------------------------------
  const fetchConversations = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) {
        setLoading(true);
      }
      setError(null);

      const [convsRes, contactsRes] = await Promise.all([
        messageService.getConversations(),
        messageService.getContacts().catch(err => {
          console.warn('Failed to fetch contacts:', err);
          return { data: { contacts: [] } };
        })
      ]);

      const rawData = convsRes.data;
      const conversationsList = rawData?.conversations || rawData?.data?.conversations || [];

      const rawContactsData = contactsRes.data;
      const contactsList = rawContactsData?.contacts || rawContactsData?.data?.contacts || [];

      const contactsMap = new Map<string, any>();
      contactsList.forEach((contact: any) => {
        if (contact.id) {
          contactsMap.set(contact.id, contact);
        }
      });

      setConversations(prev => {
        const prevById = new Map(prev.map(c => [c.id, c]));
        return conversationsList.map((c: any) => {
          const existing = prevById.get(c.partnerId);
          const contactInfo = contactsMap.get(c.partnerId);

          let rollAndClass = '';
          if (contactInfo) {
            const classStr = contactInfo.className ? `Class ${contactInfo.className}` : '';
            const rollStr = contactInfo.rollNo ? `Roll ${contactInfo.rollNo}` : '';
            rollAndClass = [classStr, rollStr].filter(Boolean).join(', ');
          }

          if (!rollAndClass) {
            rollAndClass = c.partnerRole === 'STUDENT' ? 'Student' : (c.partnerRole || '');
          }

          return {
            id: c.partnerId,
            name: c.partnerName,
            roleOrClass: rollAndClass,
            initials: getInitials(c.partnerName),
            avatarColor: getAvatarColor(c.partnerId),
            lastMessageTime: c.lastMessage ? formatTime(c.lastMessage.createdAt) : '',
            unreadCount: c.unreadCount || 0,
            lastMessage: c.lastMessage,
            // Preserve already-loaded message history instead of wiping it on every refresh
            messages: existing?.messages || [],
            hasMoreMessages: existing?.hasMoreMessages ?? false,
            messagesLoaded: existing?.messagesLoaded ?? false,
          };
        });
      });
    } catch (err: any) {
      console.error('Failed to fetch conversations:', err);
      setError(err?.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchConversations(false);
    }, [fetchConversations])
  );

  useEffect(() => {
    if (route?.params?.recipientId) {
      setSelectedChatId(route.params.recipientId);
    } else {
      setSelectedChatId(null);
    }
  }, [route?.params?.recipientId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations(true);
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roleOrClass.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const activeChat = useMemo(() => {
    return conversations.find(c => c.id === selectedChatId) || null;
  }, [conversations, selectedChatId]);

  // ---------------------------------------------------------------------
  // Message history + mark as read
  // ---------------------------------------------------------------------
  const mapServerMessage = useCallback((msg: any): Message => ({
    id: msg.id,
    text: msg.content,
    sender: msg.senderId === currentUserId ? 'me' : 'them',
    timestamp: formatTime(msg.createdAt),
    createdAt: msg.createdAt,
  }), [currentUserId]);

  useEffect(() => {
    if (!selectedChatId) return;

    let cancelled = false;
    setMessagesError(null);
    setLoadingMessages(true);

    messageService.getMessages(selectedChatId, 50)
      .then(res => {
        if (cancelled) return;
        const rawMessages = res.data?.messages || [];
        const hasMore = !!res.data?.hasMore;
        const mapped = rawMessages.map(mapServerMessage);

        setConversations(prev =>
          prev.map(c =>
            c.id === selectedChatId
              ? { ...c, messages: mapped, hasMoreMessages: hasMore, messagesLoaded: true }
              : c
          )
        );

        // Mark as read only after history has loaded successfully
        return messageService.markAsRead({ senderId: selectedChatId });
      })
      .then(readRes => {
        if (cancelled || !readRes) return;
        // Only clear the badge once the server confirms the read
        setConversations(prev =>
          prev.map(c =>
            c.id === selectedChatId ? { ...c, unreadCount: 0 } : c
          )
        );
      })
      .catch(err => {
        if (cancelled) return;
        console.error('Failed to load messages / mark as read:', err);
        setMessagesError('Could not load messages. Pull down to retry.');
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedChatId, mapServerMessage]);

  const handleLoadOlderMessages = useCallback(async () => {
    if (!activeChat || !activeChat.hasMoreMessages || loadingOlderMessages) return;
    setLoadingOlderMessages(true);
    try {
      const oldestMessage = activeChat.messages[0];
      // TODO: confirm the exact pagination param name with the backend
      // (before / cursor / offset) — using `before: oldestMessage.createdAt` as a
      // reasonable default since messages are ordered by createdAt.
      const res = await messageService.getMessages(activeChat.id, 50, {
        before: oldestMessage?.createdAt,
      });
      const rawMessages = res.data?.messages || [];
      const hasMore = !!res.data?.hasMore;
      const mapped = rawMessages.map(mapServerMessage);

      setConversations(prev =>
        prev.map(c =>
          c.id === activeChat.id
            ? { ...c, messages: [...mapped, ...c.messages], hasMoreMessages: hasMore }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to load older messages:', err);
      Alert.alert('Error', 'Could not load older messages.');
    } finally {
      setLoadingOlderMessages(false);
    }
  }, [activeChat, loadingOlderMessages, mapServerMessage]);

  // ---------------------------------------------------------------------
  // Sending messages
  // ---------------------------------------------------------------------
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChatId) return;

    const text = inputText.trim();
    const clientMessageId = generateUUID();
    const tempId = `temp-${clientMessageId}`;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const optimisticMessage: Message = {
      id: tempId,
      text,
      sender: 'me',
      timestamp: timeString,
      clientMessageId,
      status: 'sending',
    };

    setConversations(prev =>
      prev.map(c =>
        c.id === selectedChatId
          ? { ...c, lastMessageTime: timeString, messages: [...c.messages, optimisticMessage] }
          : c
      )
    );
    setInputText('');
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await messageService.sendMessage({
        recipientId: selectedChatId,
        content: text,
        clientMessageId,
      });
      const serverMessage = res.originalData?.message || res.data?.data?.message;
      if (!serverMessage) throw new Error('Malformed send response');

      const realMessage: Message = {
        id: serverMessage.id,
        text: serverMessage.content,
        sender: 'me',
        timestamp: formatTime(serverMessage.createdAt),
        createdAt: serverMessage.createdAt,
        clientMessageId,
        status: 'sent',
      };

      setConversations(prev =>
        prev.map(c => {
          if (c.id !== selectedChatId) return c;
          return {
            ...c,
            messages: c.messages.map(m => (m.id === tempId ? realMessage : m)),
            lastMessage: {
              id: serverMessage.id,
              senderId: serverMessage.senderId,
              content: serverMessage.content,
              isRead: serverMessage.isRead,
              createdAt: serverMessage.createdAt,
            },
            lastMessageTime: formatTime(serverMessage.createdAt),
          };
        })
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      // Roll back — remove the optimistic message and flag the failure
      setConversations(prev =>
        prev.map(c =>
          c.id === selectedChatId
            ? {
              ...c,
              messages: c.messages.map(m =>
                m.id === tempId ? { ...m, status: 'failed' as const } : m
              ),
            }
            : c
        )
      );
      Alert.alert('Error', 'Failed to send message. Tap the message to retry.');
    }
  };

  const handleRetryFailedMessage = async (failedMsg: Message) => {
    if (!selectedChatId || !failedMsg.clientMessageId) return;
    // Remove the failed bubble and resend as a fresh optimistic message
    setConversations(prev =>
      prev.map(c =>
        c.id === selectedChatId
          ? { ...c, messages: c.messages.filter(m => m.id !== failedMsg.id) }
          : c
      )
    );
    setInputText(failedMsg.text);
    setTimeout(() => handleSendMessage(), 0);
  };

  // ---------------------------------------------------------------------
  // Real-time stream (SSE)
  // ---------------------------------------------------------------------
  const routeIncomingMessage = useCallback((raw: any) => {
    if (!raw || !raw.id) return;
    const otherPartyId = raw.senderId === currentUserId ? raw.receiverId : raw.senderId;
    const belongsToOpenChat = otherPartyId === selectedChatId;

    setConversations(prev =>
      prev.map(c => {
        if (c.id !== otherPartyId) return c;

        // De-dupe: if this is an echo of a message we just sent, match by clientMessageId
        const alreadyPresent = c.messages.some(
          m => m.id === raw.id || (raw.clientMessageId && m.clientMessageId === raw.clientMessageId)
        );

        const updatedLastMessage = {
          id: raw.id,
          senderId: raw.senderId,
          content: raw.content,
          isRead: raw.isRead,
          createdAt: raw.createdAt,
        };

        if (alreadyPresent) {
          return { ...c, lastMessage: updatedLastMessage, lastMessageTime: formatTime(raw.createdAt) };
        }

        const incoming = mapServerMessage(raw);
        return {
          ...c,
          messages: belongsToOpenChat ? [...c.messages, incoming] : c.messages,
          lastMessage: updatedLastMessage,
          lastMessageTime: formatTime(raw.createdAt),
          unreadCount: belongsToOpenChat ? 0 : c.unreadCount + 1,
        };
      })
    );

    if (belongsToOpenChat) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      // A message just arrived in the open chat — clear it server-side too
      messageService.markAsRead({ senderId: otherPartyId }).catch(err =>
        console.error('Failed to mark incoming message as read:', err)
      );
    }
  }, [currentUserId, selectedChatId, mapServerMessage]);

  useEffect(() => {
    if (!USE_SSE || !currentUserId) return;

    let es: SimpleEventSource | null = null;
    let isMounted = true;

    const initSSE = async () => {
      try {
        const { accessToken } = await getStoredTokens();
        const token = accessToken === 'COOKIE_AUTH'
          ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlYWNoZXItMTc2NzcyNjc3MzEzOCIsInJvbGUiOiJURUFDSEVSIiwiaW5zdGl0dXRpb25JZCI6Imluc3RpdHV0aW9uLTE3Njc2Mzk1MDMwODkteXJmMHExcnB3IiwiZW1haWwiOiJhbnVyYWcuMjJiMDMxMTA4MEBhYmVzLmFjLmluIiwibmFtZSI6IkFOVVJBRyBZQURBViIsImlzQWN0aXZlIjp0cnVlLCJpc1ZlcmlmaWVkIjpmYWxzZSwiaWF0IjoxNzgyODE0MDM4LCJleHAiOjE3ODI4MTQ5Mzh9.2PzgHp774mX6C_2mKAP0M5hJnnAoARHatFMpFEmpqt4'
          : accessToken;

        if (!token || !isMounted) return;

        es = new SimpleEventSource(`${API_BASE_URL}${ENDPOINTS.MESSAGES.STREAM}`, {
          Authorization: `Bearer ${token}`
        });

        es.onmessage = (event: any) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            const raw = data.message || data;
            routeIncomingMessage(raw);
          } catch (err) {
            console.error('Failed to parse stream event:', err, event?.data);
          }
        };

        es.onerror = (err: any) => {
          console.error('Message stream error:', err);
          if (isMounted) setStreamConnected(false);
        };

        if (isMounted) setStreamConnected(true);
      } catch (err) {
        console.error('Failed to init student SSE stream:', err);
      }
    };

    initSSE();

    return () => {
      isMounted = false;
      if (es) {
        es.close();
      }
      setStreamConnected(false);
    };
  }, [currentUserId, routeIncomingMessage]);

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />

      {activeChat ? (
        // Thread View Screen
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Thread Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.setParams({ recipientId: undefined, recipientName: undefined })} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.primary} />
            </TouchableOpacity>
            <View style={[styles.avatarCircle, { backgroundColor: activeChat.avatarColor, marginLeft: 12 }]}>
              <Text style={styles.avatarInitial}>{activeChat.initials}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitleText} numberOfLines={1}>{activeChat.name}</Text>
              <Text style={styles.headerSubText} numberOfLines={1}>
                {activeChat.roleOrClass}
                {USE_SSE ? (streamConnected ? ' · Live' : ' · Reconnecting…') : ''}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Messages Scroll Area */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messageScrollContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
          >
            {loadingMessages ? (
              <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
            ) : messagesError ? (
              <View style={styles.emptyThreadContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.emptyThreadText}>{messagesError}</Text>
              </View>
            ) : activeChat.messages.length === 0 ? (
              <View style={styles.emptyThreadContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={theme.subtext} />
                <Text style={styles.emptyThreadText}>No messages yet</Text>
                <Text style={styles.emptyThreadSubText}>Start the conversation below.</Text>
              </View>
            ) : (
              <>
                {activeChat.hasMoreMessages && (
                  <TouchableOpacity
                    onPress={handleLoadOlderMessages}
                    disabled={loadingOlderMessages}
                    style={styles.loadOlderBtn}
                  >
                    {loadingOlderMessages ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Text style={styles.loadOlderText}>Load older messages</Text>
                    )}
                  </TouchableOpacity>
                )}
                {activeChat.messages.map((msg) => {
                  const isMe = msg.sender === 'me';
                  const isFailed = msg.status === 'failed';
                  return (
                    <TouchableOpacity
                      key={msg.id}
                      activeOpacity={isFailed ? 0.6 : 1}
                      onPress={() => isFailed && handleRetryFailedMessage(msg)}
                      style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}
                    >
                      {!isMe && (
                        <View style={[styles.msgAvatar, { backgroundColor: activeChat.avatarColor }]}>
                          <Text style={styles.msgAvatarText}>{activeChat.initials}</Text>
                        </View>
                      )}
                      <View style={styles.bubbleContainer}>
                        <View style={[
                          styles.bubble,
                          isMe ? styles.bubbleMe : styles.bubbleThem,
                          isFailed && styles.bubbleFailed,
                        ]}>
                          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                            {msg.text}
                          </Text>
                        </View>
                        <View style={[styles.metaContainer, isMe ? styles.metaRight : styles.metaLeft]}>
                          {isFailed ? (
                            <Text style={styles.failedText}>Failed to send · tap to retry</Text>
                          ) : (
                            <>
                              <Text style={styles.timestampText}>{msg.timestamp}</Text>
                              {isMe && msg.status !== 'sending' && (
                                <Ionicons name="checkmark-done" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
                              )}
                              {isMe && msg.status === 'sending' && (
                                <ActivityIndicator size="small" color={theme.subtext} style={{ marginLeft: 4 }} />
                              )}
                            </>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>

          {/* Input Bar Pinned to Bottom */}
          <View style={styles.inputContainer}>
            <View style={styles.inputPill}>
              <TextInput
                style={styles.textInput}
                placeholder={`Type a message to ${activeChat.name.split(' ')[0]}...`}
                placeholderTextColor={theme.placeholder}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity onPress={handleSendMessage} style={styles.sendBtn}>
                <Ionicons name="paper-plane" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      ) : (
        // Conversation List Screen
        <View style={styles.container}>
          <StudentHeader
            title="Messages"
            navigation={navigation}
            onMenuPress={() => setDrawerOpen(true)}
          />

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={20} color={theme.subtext} style={styles.searchIcon} />
            <TextInput
              placeholder="Search teacher or subject..."
              placeholderTextColor={theme.placeholder}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Section title */}
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles" size={20} color="#6366F1" />
            <Text style={styles.sectionHeaderText}>Class Chat</Text>
          </View>

          {/* Scrollable Conversation List */}
          <ScrollView
            contentContainerStyle={styles.listScrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
          >
            {loading && !refreshing ? (
              <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
            ) : error ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.emptyText}>{error}</Text>
              </View>
            ) : filteredConversations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={theme.subtext} />
                <Text style={styles.emptyText}>No conversations yet</Text>
              </View>
            ) : (
              filteredConversations.map((chat) => {
                const lastMsg = chat.lastMessage;
                const isMe = lastMsg?.senderId === currentUserId;
                const isSelected = chat.id === selectedChatId;

                return (
                  <TouchableOpacity
                    key={chat.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      navigation.navigate('Messages', {
                        recipientId: chat.id,
                        recipientName: chat.name,
                      });
                    }}
                    style={[styles.chatRow, isSelected && styles.chatRowSelected]}
                  >
                    <View style={[styles.avatarCircle, { backgroundColor: chat.avatarColor }]}>
                      <Text style={styles.avatarInitial}>{chat.initials}</Text>
                    </View>
                    <View style={styles.chatInfo}>
                      <View style={styles.chatInfoHeader}>
                        <Text style={styles.chatName} numberOfLines={1}>{chat.name}</Text>
                        <Text style={styles.lastTimeText}>{chat.lastMessageTime || ''}</Text>
                      </View>
                      <Text style={styles.roleSubtext}>{chat.roleOrClass}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.previewText, { flex: 1 }]} numberOfLines={1}>
                          {lastMsg ? (isMe ? 'You: ' : '') + lastMsg.content : 'No messages yet'}
                        </Text>
                        {chat.unreadCount > 0 && (
                          <View style={[styles.unreadBadge, { backgroundColor: theme.primary }]}>
                            <Text style={styles.unreadBadgeText}>{chat.unreadCount}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="student" />
        </View>
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    backgroundColor: theme.surface,
  },
  backBtn: {
    padding: 4,
  },
  menuBtn: {
    padding: 4,
  },
  centerHeaderTitle: {
    alignItems: 'center',
  },
  headerMainTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
  },
  portalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.subtext,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.text,
  },
  headerSubText: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '600',
    marginTop: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.text,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
  },
  listScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface,
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  chatRowSelected: {
    borderColor: theme.isDarkMode ? '#312E81' : '#C7D2FE',
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
    backgroundColor: theme.isDarkMode ? '#1E1B4B' : '#F5F7FF',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 14,
  },
  chatInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.text,
    flex: 1,
  },
  lastTimeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.subtext,
  },
  roleSubtext: {
    fontSize: 11,
    color: theme.subtext,
    fontWeight: '600',
    marginTop: 2,
  },
  previewText: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '500',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 13,
    color: theme.subtext,
    fontWeight: '500',
  },
  messageScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexGrow: 1,
  },
  emptyThreadContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyThreadText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.text,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyThreadSubText: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '500',
    marginTop: 4,
  },
  loadOlderBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 16,
  },
  loadOlderText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.primary,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  rowLeft: {
    alignSelf: 'flex-start',
  },
  rowRight: {
    alignSelf: 'flex-end',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginBottom: 18,
  },
  msgAvatarText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  bubbleContainer: {
    flexDirection: 'column',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleMe: {
    backgroundColor: theme.primary,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderBottomLeftRadius: 4,
  },
  bubbleFailed: {
    opacity: 0.5,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  bubbleTextMe: {
    color: '#FFF',
  },
  bubbleTextThem: {
    color: theme.text,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaLeft: {
    alignSelf: 'flex-start',
  },
  metaRight: {
    alignSelf: 'flex-end',
  },
  timestampText: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.subtext,
  },
  failedText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#EF4444',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.surface,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 4,
    color: '#000000',
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  unreadBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});

export default Messages;