import React, { useState, useMemo, useRef } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp, FadeInDown, SlideInRight } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: string;
}

interface Conversation {
  id: string;
  name: string;
  roleOrClass: string;
  initials: string;
  avatarColor: string;
  lastMessageTime: string;
  messages: Message[];
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    name: 'Atharv Ragdwal',
    roleOrClass: 'Class Representative • 12-A',
    initials: 'AR',
    avatarColor: '#F97316', // Orange
    lastMessageTime: '10:20 AM',
    messages: [
      { id: '1-1', text: 'Hey, did you finish the physics assignment?', sender: 'me', timestamp: '10:15 AM' },
      { id: '1-2', text: 'Yes, I just uploaded it to the portal.', sender: 'them', timestamp: '10:18 AM' },
      { id: '1-3', text: 'Great, thanks! Can you share the lab manual notes too?', sender: 'me', timestamp: '10:20 AM' },
    ],
  },
  {
    id: '2',
    name: 'Rishii',
    roleOrClass: 'Physics Teacher',
    initials: 'R',
    avatarColor: '#10B981', // Green
    lastMessageTime: '',
    messages: [], // Test empty state
  },
  {
    id: '3',
    name: 'Priya Sharma',
    roleOrClass: 'Mathematics HOD',
    initials: 'PS',
    avatarColor: '#3B82F6', // Blue
    lastMessageTime: 'Yesterday',
    messages: [
      { id: '3-1', text: 'Please submit your calculus project by Friday afternoon.', sender: 'them', timestamp: 'Yesterday' },
      { id: '3-2', text: 'Sure ma\'am, I will submit it on time.', sender: 'me', timestamp: 'Yesterday' },
    ],
  },
  {
    id: '4',
    name: 'Amit Verma',
    roleOrClass: 'Chemistry Teacher',
    initials: 'AV',
    avatarColor: '#8B5CF6', // Purple
    lastMessageTime: '2 days ago',
    messages: [
      { id: '4-1', text: 'Class has been rescheduled to 11:30 AM tomorrow.', sender: 'them', timestamp: '2 days ago' },
    ],
  },
];

const Messages = () => {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Filter conversations for list view
  const filteredConversations = useMemo(() => {
    return conversations.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.roleOrClass.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const activeChat = useMemo(() => {
    return conversations.find(c => c.id === selectedChatId) || null;
  }, [conversations, selectedChatId]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !selectedChatId) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage: Message = {
      id: `${selectedChatId}-${Date.now()}`,
      text: inputText.trim(),
      sender: 'me',
      timestamp: timeString,
    };

    setConversations(prev =>
      prev.map(c => {
        if (c.id === selectedChatId) {
          return {
            ...c,
            lastMessageTime: timeString,
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      })
    );

    setInputText('');
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" />

      {activeChat ? (
        // Thread View Screen
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {/* Thread Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setSelectedChatId(null)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#6366F1" />
            </TouchableOpacity>
            <View style={[styles.avatarCircle, { backgroundColor: activeChat.avatarColor }]}>
              <Text style={styles.avatarInitial}>{activeChat.initials}</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitleText} numberOfLines={1}>{activeChat.name}</Text>
              <Text style={styles.headerSubText} numberOfLines={1}>{activeChat.roleOrClass}</Text>
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
            {activeChat.messages.length === 0 ? (
              <View style={styles.emptyThreadContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyThreadText}>No messages yet</Text>
                <Text style={styles.emptyThreadSubText}>Start the conversation below.</Text>
              </View>
            ) : (
              activeChat.messages.map((msg, index) => {
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
                        {isMe && <Ionicons name="checkmark-done" size={14} color="#6366F1" style={{ marginLeft: 4 }} />}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Input Bar Pinned to Bottom */}
          <View style={styles.inputContainer}>
            <View style={styles.inputPill}>
              <TextInput
                style={styles.textInput}
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
          {/* List Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setDrawerOpen(true)} style={styles.menuBtn}>
              <Ionicons name="menu" size={28} color="#6366F1" />
            </TouchableOpacity>
            <View style={styles.centerHeaderTitle}>
              <Text style={styles.headerMainTitle}>Messages</Text>
              <Text style={styles.portalLabel}>STUDENT PORTAL</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput
              placeholder="Search teacher or subject..."
              placeholderTextColor="#94A3B8"
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
          >
            {filteredConversations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No conversations found</Text>
              </View>
            ) : (
              filteredConversations.map((chat) => {
                const hasMessages = chat.messages.length > 0;
                const lastMsg = hasMessages ? chat.messages[chat.messages.length - 1] : null;
                const isSelected = chat.id === selectedChatId;

                return (
                  <TouchableOpacity
                    key={chat.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedChatId(chat.id)}
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
                      <Text style={styles.previewText} numberOfLines={1}>
                        {lastMsg ? (lastMsg.sender === 'me' ? 'You: ' : '') + lastMsg.text : 'No messages yet'}
                      </Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFAFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFF',
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
    color: '#1E293B',
  },
  portalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
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
    color: '#1E293B',
  },
  headerSubText: {
    fontSize: 11,
    color: '#64748B',
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
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#1E293B',
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
    color: '#1E293B',
  },
  listScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
  },
  chatRowSelected: {
    borderColor: '#C7D2FE',
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
    backgroundColor: '#F5F7FF',
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
    color: '#1E293B',
    flex: 1,
  },
  lastTimeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  roleSubtext: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  previewText: {
    fontSize: 12,
    color: '#94A3B8',
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
    color: '#94A3B8',
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
    color: '#64748B',
    marginTop: 12,
  },
  emptyThreadSubText: {
    fontSize: 12,
    color: '#94A3B8',
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
    backgroundColor: '#6366F1', // Purple accent
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    color: '#1E293B',
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
    color: '#94A3B8',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 4,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default Messages;
