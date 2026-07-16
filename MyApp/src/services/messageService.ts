import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/api';

const messageService = {
    // Conversation list
    getConversations() {
        return apiClient.get(ENDPOINTS.MESSAGES.CONVERSATION);
    },

    // Contacts
    getContacts() {
        return apiClient.get(ENDPOINTS.MESSAGES.CONTACTS);
    },

    // Chat history with a recipient
    getMessages(recipientId: string, limit = 50, options?: { before?: string }) {
        const url = ENDPOINTS.MESSAGES.MESSAGES(recipientId, limit);
        const fullUrl = options?.before ? `${url}&before=${options.before}` : url;
        return apiClient.get(fullUrl);
    },

    sendMessage(data: {
        recipientId: string;
        content: string;
        clientMessageId: string;
    }) {
        return apiClient.post(
            ENDPOINTS.MESSAGES.MESSAGE,
            {
                receiverId: data.recipientId,
                content: data.content,
                clientMessageId: data.clientMessageId,
            }
        );
    },

    // Mark messages as read
    markAsRead(data: {
        senderId: string;
    }) {
        return apiClient.put(
            ENDPOINTS.MESSAGES.READ,
            data
        );
    },
};

export default messageService;