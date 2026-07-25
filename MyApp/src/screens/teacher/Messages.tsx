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
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import { TeacherHeader } from '../../components/TeacherHeader';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import ScaleButton from '../../components/animations/ScaleButton';
import messageService from '../../services/messageService';
import { getStoredTokens } from '../../services/apiClient';
import { API_BASE_URL, ENDPOINTS } from '../../constants/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them'; // 'me' is the Teacher, 'them' is the Student
  timestamp: string;
  clientMessageId?: string;
}

interface Conversation {
  id: string;
  name: string;
  rollAndClass: string;
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

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

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

const Messages = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { authState } = useAuth();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles({ ...theme, isDarkMode });
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messageLimit, setMessageLimit] = useState(50);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  
  const shouldScrollToBottomRef = useRef(false);

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
      
      const mapped = conversationsList.map((c: any) => {
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
          rollAndClass: rollAndClass,
          initials: getInitials(c.partnerName),
          avatarColor: getAvatarColor(c.partnerId),
          lastMessageTime: c.lastMessage ? formatTime(c.lastMessage.createdAt) : '',
          unreadCount: c.unreadCount || 0,
          lastMessage: c.lastMessage,
          messages: [],
        };
      });
      
      setConversations(mapped);
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

  const selectedChatIdRef = useRef(selectedChatId);
  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    if (route?.params?.recipientId) {
      setSelectedChatId(route.params.recipientId);
      shouldScrollToBottomRef.current = true;
    } else {
      setSelectedChatId(null);
    }
  }, [route?.params?.recipientId]);

  // Fetch messages + mark as read when entering a chat
  useEffect(() => {
    if (!selectedChatId) {
      setMessageLimit(50);
      setHasMoreMessages(false);
      return;
    }

    let cancelled = false;
    setLoadingMessages(true);
    setMessagesError(null);

    messageService.getMessages(selectedChatId, messageLimit)
      .then(res => {
        if (cancelled) return;
        const rawData = res.data;
        const messagesList = rawData?.messages || rawData?.data?.messages || [];
        const hasMore = rawData?.hasMore ?? rawData?.data?.hasMore ?? false;
        
        setHasMoreMessages(hasMore);

        const mappedMessages = messagesList.map((msg: any) => ({
          id: msg.id,
          text: msg.content,
          sender: msg.senderId === authState.user?.id ? 'me' : 'them',
          timestamp: formatTime(msg.createdAt),
          clientMessageId: msg.clientMessageId,
        }));

        setConversations(prev =>
          prev.map(c =>
            c.id === selectedChatId
              ? { ...c, messages: mappedMessages }
              : c
          )
        );

        // Mark as read on backend
        return messageService.markAsRead({ senderId: selectedChatId });
      })
      .then(res => {
        if (cancelled || !res) return;
        const data = res.data;
        const markedReadCount = data?.markedRead ?? data?.data?.markedRead;
        if (typeof markedReadCount === 'number') {
          setConversations(prev =>
            prev.map(c =>
              c.id === selectedChatId
                ? { ...c, unreadCount: 0 }
                : c
            )
          );
        }
      })
      .catch(err => {
        if (!cancelled) {
          setMessagesError('Could not load message history.');
        }
        console.error('Failed to load messages:', err);
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingMessages(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedChatId, messageLimit, authState.user?.id]);

  // Persistent EventSource SSE Connection for real-time messages
  useEffect(() => {
    let sse: SimpleEventSource | null = null;
    let isMounted = true;

    const setupSSE = async () => {
      try {
        const { accessToken } = await getStoredTokens();
        const token = accessToken === 'COOKIE_AUTH'
          ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlYWNoZXItMTc2NzcyNjc3MzEzOCIsInJvbGUiOiJURUFDSEVSIiwiaW5zdGl0dXRpb25JZCI6Imluc3RpdHV0aW9uLTE3Njc2Mzk1MDMwODkteXJmMHExcnB3IiwiZW1haWwiOiJhbnVyYWcuMjJiMDMxMTA4MEBhYmVzLmFjLmluIiwibmFtZSI6IkFOVVJBRyBZQURBViIsImlzQWN0aXZlIjp0cnVlLCJpc1ZlcmlmaWVkIjpmYWxzZSwiaWF0IjoxNzgyODE0MDM4LCJleHAiOjE3ODI4MTQ5Mzh9.2PzgHp774mX6C_2mKAP0M5hJnnAoARHatFMpFEmpqt4'
          : accessToken;

        if (!token) return;

        const url = `${API_BASE_URL}${ENDPOINTS.MESSAGES.STREAM}`;
        sse = new SimpleEventSource(url, {
          Authorization: `Bearer ${token}`
        });

        sse.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            const msgObj = data?.message || data;
            if (!msgObj || !msgObj.id) return;

            const isSentByMe = msgObj.senderId === authState.user?.id;
            const partnerId = isSentByMe ? msgObj.receiverId : msgObj.senderId;

            if (!partnerId) return;

            const newMsg: Message = {
              id: msgObj.id,
              text: msgObj.content,
              sender: isSentByMe ? 'me' : 'them',
              timestamp: formatTime(msgObj.createdAt),
              clientMessageId: msgObj.clientMessageId
            };

            const currentActiveId = selectedChatIdRef.current;

            setConversations(prev => {
              return prev.map(c => {
                if (c.id === partnerId) {
                  // Deduplicate: check if message already exists by id or clientMessageId
                  const exists = c.messages.some(m => 
                    m.id === newMsg.id || 
                    (newMsg.clientMessageId && m.clientMessageId === newMsg.clientMessageId) ||
                    (m.id.startsWith('temp-') && msgObj.clientMessageId && m.id === msgObj.clientMessageId)
                  );

                  let updatedMessages = c.messages;
                  if (!exists) {
                    updatedMessages = [...c.messages, newMsg];
                  } else {
                    // Update optimistic message with real message
                    updatedMessages = c.messages.map(m => {
                      if (
                        (newMsg.clientMessageId && m.clientMessageId === newMsg.clientMessageId) ||
                        (m.id.startsWith('temp-') && msgObj.clientMessageId && m.id === msgObj.clientMessageId)
                      ) {
                        return newMsg;
                      }
                      return m;
                    });
                  }

                  const isCurrentOpen = currentActiveId === partnerId;
                  return {
                    ...c,
                    messages: updatedMessages,
                    unreadCount: isCurrentOpen ? 0 : c.unreadCount + (isSentByMe ? 0 : 1),
                    lastMessage: msgObj,
                    lastMessageTime: newMsg.timestamp,
                  };
                }
                return c;
              });
            });

            // Mark read on backend if chat is active and message is incoming
            if (currentActiveId === partnerId && !isSentByMe) {
              messageService.markAsRead({ senderId: partnerId }).catch(console.error);
            }

            // Scroll to bottom if this chat is active
            if (currentActiveId === partnerId) {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }

          } catch (parseErr) {
            console.error('Error parsing SSE event data:', parseErr);
          }
        };

        sse.onerror = (err) => {
          console.warn('SSE stream error:', err);
        };

      } catch (err) {
        console.error('Failed to initialize SSE connection:', err);
      }
    };

    setupSSE();

    return () => {
      isMounted = false;
      if (sse) {
        sse.close();
      }
    };
  }, [authState.user?.id]);

  const activeChat = useMemo(() => {
    return conversations.find(c => c.id === selectedChatId) || null;
  }, [conversations, selectedChatId]);

  useEffect(() => {
    if (!loadingMessages && shouldScrollToBottomRef.current && activeChat?.messages?.length) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
      shouldScrollToBottomRef.current = false;
    }
  }, [loadingMessages, activeChat?.messages?.length]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations(true);
  };

  // Filter conversations based on student name or class/roll number
  const filteredConversations = useMemo(() => {
    return conversations.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.rollAndClass.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedChatId) return;

    const text = inputText.trim();
    const clientMessageId = generateUUID();
    const tempId = `temp-${Date.now()}`;
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const optimisticMsg: Message = {
      id: tempId,
      text,
      sender: 'me',
      timestamp: timeString,
      clientMessageId,
    };

    // Optimistically add message
    setConversations(prev =>
      prev.map(c => {
        if (c.id === selectedChatId) {
          return {
            ...c,
            lastMessageTime: timeString,
            messages: [...c.messages, optimisticMsg],
          };
        }
        return c;
      })
    );
    setInputText('');
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const res = await messageService.sendMessage({
        recipientId: selectedChatId,
        content: text,
        clientMessageId,
      });

      const rawMsg = res.originalData?.message || res.data?.data?.message;
      const realMsg: Message = {
        id: rawMsg?.id || `msg-${Date.now()}`,
        text,
        sender: 'me',
        timestamp: formatTime(rawMsg?.createdAt || new Date().toISOString()),
        clientMessageId,
      };

      // Replace optimistic message with real message and update list preview
      setConversations(prev =>
        prev.map(c => {
          if (c.id === selectedChatId) {
            return {
              ...c,
              lastMessageTime: realMsg.timestamp,
              messages: c.messages.map(m => (m.clientMessageId === clientMessageId || m.id === tempId ? realMsg : m)),
              lastMessage: rawMsg,
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error('Failed to send message:', err);
      
      // Rollback
      setConversations(prev =>
        prev.map(c => {
          if (c.id === selectedChatId) {
            return {
              ...c,
              messages: c.messages.filter(m => m.clientMessageId !== clientMessageId && m.id !== tempId),
            };
          }
          return c;
        })
      );
      
      Alert.alert('Error', 'Failed to send message. Please check your connection and try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.surface} />

      {activeChat ? (
        // Thread View Screen
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Thread Header */}
          <View style={[styles.globalHeader, { backgroundColor: theme.surface }]}>
            <TouchableOpacity onPress={() => navigation.setParams({ recipientId: undefined, recipientName: undefined })} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <View style={[styles.avatarCircle, { backgroundColor: activeChat.avatarColor, marginLeft: 12 }]}>
              <Text style={styles.avatarInitial}>{activeChat.initials}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.headerTitleText, { color: theme.text }]} numberOfLines={1}>{activeChat.name}</Text>
              <Text style={[styles.headerSubText, { color: theme.subtext }]} numberOfLines={1}>{activeChat.rollAndClass || ''}</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Messages Scroll Area */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messageScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {loadingMessages && activeChat.messages.length === 0 ? (
              <View style={styles.emptyThreadContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            ) : messagesError ? (
              <View style={styles.emptyThreadContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={[styles.emptyThreadText, { color: theme.text }]}>{messagesError}</Text>
                <TouchableOpacity
                  onPress={() => setMessageLimit(50)}
                  style={[styles.loadMoreBtn, { marginTop: 12 }]}
                >
                  <Text style={styles.loadMoreText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : activeChat.messages.length === 0 ? (
              <View style={styles.emptyThreadContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={theme.border} />
                <Text style={[styles.emptyThreadText, { color: theme.text }]}>No messages yet</Text>
                <Text style={styles.emptyThreadSubText}>Start the conversation below.</Text>
              </View>
            ) : (
              <>
                {hasMoreMessages && (
                  <TouchableOpacity
                    onPress={() => setMessageLimit(prev => prev + 50)}
                    style={styles.loadMoreBtn}
                  >
                    <Text style={styles.loadMoreText}>Load older messages</Text>
                  </TouchableOpacity>
                )}
                {activeChat.messages.map((msg) => {
                  const isMe = msg.sender === 'me';
                  return (
                    <View
                      key={msg.id}
                      style={[styles.messageRow, isMe ? styles.rowRight : styles.rowLeft]}
                    >
                      {!isMe && (
                        <View style={[styles.msgAvatar, { backgroundColor: activeChat.avatarColor }]}>
                          <Text style={styles.msgAvatarText}>{activeChat.initials}</Text>
                        </View>
                      )}
                      <View style={styles.bubbleContainer}>
                        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                            {msg.text}
                          </Text>
                        </View>
                        <View style={[styles.metaContainer, isMe ? styles.metaRight : styles.metaLeft]}>
                          <Text style={styles.timestampText}>{msg.timestamp}</Text>
                          {isMe && <Ionicons name="checkmark-done" size={14} color={theme.primary} style={{ marginLeft: 4 }} />}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}
          </ScrollView>

          {/* Input Bar Pinned to Bottom */}
          <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <View style={[styles.inputPill, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: theme.border }]}>
              <TextInput
                style={[styles.textInput, { color: theme.text }]}
                placeholder={`Type a message to ${activeChat.name.split(' ')[0]}...`}
                placeholderTextColor="#94A3B8"
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
          {/* Global Header */}
          <TeacherHeader
            title="Messages"
            navigation={navigation}
            onMenuPress={() => setDrawerOpen(true)}
          />

          {/* Search Bar */}
          <View style={[styles.searchWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              placeholder="Search student or roll no..."
              placeholderTextColor="#94A3B8"
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Section title */}
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubbles" size={20} color="#8B5CF6" />
            <Text style={[styles.sectionHeaderText, { color: theme.text }]}>Class Chat</Text>
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
                <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No conversations yet</Text>
              </View>
            ) : (
              filteredConversations.map((chat) => {
                const lastMsg = chat.lastMessage;
                const isMe = lastMsg?.senderId === authState.user?.id;
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
                    style={[
                      styles.chatRow,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                      isSelected && styles.chatRowSelected,
                    ]}
                  >
                    <View style={[styles.avatarCircle, { backgroundColor: chat.avatarColor }]}>
                      <Text style={styles.avatarInitial}>{chat.initials}</Text>
                    </View>
                    <View style={styles.chatInfo}>
                      <View style={styles.chatInfoHeader}>
                        <Text style={[styles.chatName, { color: theme.text }]} numberOfLines={1}>{chat.name}</Text>
                        <Text style={styles.lastTimeText}>{chat.lastMessageTime || ''}</Text>
                      </View>
                      <Text style={[styles.roleSubtext, { color: theme.subtext }]}>{chat.rollAndClass}</Text>
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

          <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="teacher" />
        </View>
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
  menuHandle: {
    paddingRight: 10,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 4,
  },
  centerHeaderTitle: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  portalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8B5CF6',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleText: {
    fontSize: 15,
    fontWeight: '800',
  },
  headerSubText: {
    fontSize: 11,
    marginTop: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: theme.surface,
    borderColor: theme.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: theme.text,
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
    color: theme.primary,
  },
  listScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
    backgroundColor: theme.surface,
    borderColor: theme.border,
  },
  chatRowSelected: {
    borderColor: theme.isDarkMode ? '#8B5CF6' : '#C7D2FE',
    borderLeftWidth: 4,
    borderLeftColor: theme.primary,
    backgroundColor: theme.isDarkMode ? '#312E8140' : '#F5F7FF',
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
    fontWeight: '600',
    color: theme.primary,
    marginTop: 2,
  },
  previewText: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '500',
    marginTop: 4,
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
  loadMoreBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: theme.isDarkMode ? '#334155' : '#F1F5F9',
    marginVertical: 10,
  },
  loadMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.primary,
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
  },
  emptyThreadSubText: {
    fontSize: 12,
    color: theme.subtext,
    fontWeight: '500',
    marginTop: 4,
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
    backgroundColor: theme.isDarkMode ? '#334155' : '#FFF',
    borderWidth: 1,
    borderColor: theme.border,
    borderBottomLeftRadius: 4,
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
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    backgroundColor: theme.surface,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    borderColor: theme.border,
    backgroundColor: theme.background,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 4,
    color: theme.text,
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
});

export default Messages;
