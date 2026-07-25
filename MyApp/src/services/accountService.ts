import apiClient from './apiClient';
import { ENDPOINTS } from '../constants/api';

interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  dob?: string;
  address?: string;
  [key: string]: any;
}

const accountService = {
    getProfile() {
        return apiClient.get(ENDPOINTS.ACCOUNT.PROFILE);
    },

    updateProfile(data: UpdateProfileRequest) {
        return apiClient.patch(ENDPOINTS.ACCOUNT.PROFILE, data);
    },

    getStudentInfo() {
        return apiClient.get(ENDPOINTS.ACCOUNT.STUDENT);
    },

    getParentInfo() {
        return apiClient.get(ENDPOINTS.ACCOUNT.PARENT);
    },

    getEmergencyContact() {
        return apiClient.get(ENDPOINTS.ACCOUNT.EMERGENCY);
    },

    updateParentInfo(data: any) {
    return apiClient.patch(ENDPOINTS.ACCOUNT.PARENT, data);
},
    updateEmergencyContact(data: any) {
        return apiClient.patch(ENDPOINTS.ACCOUNT.EMERGENCY, data);
    },

    changePassword(data: any) {
        return apiClient.post(ENDPOINTS.ACCOUNT.CHANGE_PASSWORD, data);
    },

    getPreferences() {
        return apiClient.get(ENDPOINTS.ACCOUNT.PREFERENCES);
    },

    updatePreferences(data: any) {
        return apiClient.put(ENDPOINTS.ACCOUNT.PREFERENCES, data);
    },

    uploadPhoto(data: FormData) {
        return apiClient.post('/account/student/photo', data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    deletePhoto() {
        return apiClient.delete('/account/student/photo');
    },
};

export default accountService;
