import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Platform,
    StatusBar,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ScaleButton from '../../components/animations/ScaleButton';
import { useAuth } from '../../store/AuthContext';
import { getApiErrorMessage } from '../../services/apiClient';
import principalService from '../../services/principalService';
import { COUNTRIES } from '../../constants/countries';
import SelectionModal from '../../components/modals/SelectionModal';

let DateTimePicker: any = null;
try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (error) {
    console.warn('DateTimePicker not available');
}

const initialFormState = {
    name: '', dob: '', gender: '', rollNo: '',
    phone: '', address: '',
    parentName: '', parentPhone: '', parentEmail: '', parentRelationship: '',
    emergencyName: '', emergencyPhone: '', emergencyEmail: '', emergencyRelationship: '',
    countryCode: '+91', parentCountryCode: '+91', emergencyCountryCode: '+91'
};

const FormField = ({ label, value, onChangeText, placeholder, keyboardType, required, onPress, countryCode, onCountryCodePress, editable = true, style }: any) => (
    <View style={[styles.field, style]}>
        <Text style={styles.label}>{label.toUpperCase()} {required && <Text style={{ color: '#EF4444' }}>*</Text>}</Text>
        <View style={{ flexDirection: 'row', opacity: editable ? 1 : 0.6 }}>
            {countryCode && (
                <TouchableOpacity
                    style={[styles.countryCodePicker, { marginRight: 12 }]}
                    onPress={editable ? onCountryCodePress : undefined}
                    disabled={!editable}
                >
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                    <Ionicons name="caret-down" size={10} color="#94A3B8" />
                </TouchableOpacity>
            )}
            {onPress && editable ? (
                <TouchableOpacity
                    style={[styles.premiumInput, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                    onPress={onPress}
                >
                    <Text style={[styles.premiumInputText, !value && { color: '#94A3B8' }]}>
                        {value || placeholder}
                    </Text>
                    <Ionicons name="chevron-down" size={18} color="#94A3B8" />
                </TouchableOpacity>
            ) : (
                <TextInput
                    style={[styles.premiumInput, { flex: 1 }]}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor="#94A3B8"
                    keyboardType={keyboardType}
                    editable={editable}
                />
            )}
        </View>
    </View>
);

const PrincipalEditStudentScreen = ({ navigation, route }: any) => {
    const { authState } = useAuth();
    const { studentId } = route.params;

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [studentEmail, setStudentEmail] = useState('');

    // Form state
    const [formData, setFormData] = useState({ ...initialFormState });
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [selectionConfig, setSelectionConfig] = useState<{
        visible: boolean;
        title: string;
        field: string;
        options: string[];
    }>({
        visible: false,
        title: '',
        field: '',
        options: []
    });

    const extractPhoneCode = useCallback((phoneString: string) => {
        if (!phoneString) return { code: '+91', number: '' };
        // Check if there's a space after the code
        const match = phoneString.match(/^(\+\d{1,4})\s+(.*)$/);
        if (match) return { code: match[1], number: match[2] };
        // If no space, try to separate by finding the first '+' and splitting the rest
        const plusMatch = phoneString.match(/^(\+\d{1,4})(.*)$/);
        if (plusMatch) return { code: plusMatch[1], number: plusMatch[2] };
        // Fallback
        return { code: '+91', number: phoneString };
    }, []);

    const formatDate = useCallback((isoString: string) => {
        if (!isoString) return '';
        // Just take the date part without timezone conversion
        return isoString.split('T')[0] || '';
    }, []);

    useEffect(() => {
        let isMounted = true;
        const fetchStudentData = async () => {
            try {
                const response = await principalService.getStudentDetail(studentId);

                if (!isMounted) return;

                // Handle various response wrappers
                const rawData = response.data?.data || response.data || {};
                const data = rawData.student || rawData;

                setStudentEmail(data.email || '');

                const phoneObj = extractPhoneCode(data.phone || data.user?.phone);
                const parentPhoneObj = extractPhoneCode(data.parentPhone || data.parent_phone);
                const emergencyPhoneObj = extractPhoneCode(data.emergencyPhone || data.emergency_phone);

                setFormData({
                    name: data.name || '',
                    rollNo: data.rollNo || data.roll_no || '',
                    dob: formatDate(data.dateOfBirth || data.date_of_birth),
                    gender: data.gender || '',
                    phone: phoneObj.number,
                    countryCode: phoneObj.code,
                    address: data.address || '',
                    parentName: data.parentName || data.parent_name || '',
                    parentPhone: parentPhoneObj.number,
                    parentCountryCode: parentPhoneObj.code,
                    parentEmail: data.parentEmail || data.parent_email || '',
                    parentRelationship: data.parentRelationship || data.parent_relationship || '',
                    emergencyName: data.emergencyName || data.emergency_name || '',
                    emergencyPhone: emergencyPhoneObj.number,
                    emergencyCountryCode: emergencyPhoneObj.code,
                    emergencyEmail: data.emergencyEmail || data.emergency_email || '',
                    emergencyRelationship: data.emergencyRelationship || data.emergency_relationship || '',
                });
            } catch (error) {
                if (!isMounted) return;
                console.error('Failed to fetch student:', error);
                Alert.alert('Error', getApiErrorMessage(error), [
                    { text: 'Go Back', onPress: () => navigation.goBack() }
                ]);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        fetchStudentData();

        return () => {
            isMounted = false;
        };
    }, [studentId, navigation, extractPhoneCode, formatDate]);

    const updateForm = useCallback((field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleOpenDatePicker = useCallback(() => {
        setShowDatePicker(true);
    }, []);

    const onDateChange = useCallback((event: any, selectedDate?: Date) => {
        if (event.type === 'set' && selectedDate) {
            const yyyy = selectedDate.getFullYear();
            const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const dd = String(selectedDate.getDate()).padStart(2, '0');
            const formatted = `${yyyy}-${mm}-${dd}`;
            updateForm('dob', formatted);
        }
        // Close picker on both 'set' and 'dismissed'
        if (Platform.OS === 'android' || event.type === 'set' || event.type === 'dismissed') {
            setShowDatePicker(false);
        }
    }, [updateForm]);

    const handleOpenSelection = useCallback((title: string, field: string, options: string[]) => {
        setSelectionConfig({ visible: true, title, field, options });
    }, []);

    const handleSelectOption = useCallback((option: string) => {
        if (selectionConfig.field.includes('CountryCode')) {
            const code = option.split(' ').pop() || option;
            updateForm(selectionConfig.field, code);
        } else {
            updateForm(selectionConfig.field, option);
        }
        setSelectionConfig(prev => ({ ...prev, visible: false }));
    }, [selectionConfig.field, updateForm]);

    const handleSubmit = useCallback(async () => {
        // Required fields
        if (!formData.name.trim()) {
            Alert.alert('Error', 'Full name is required.');
            return;
        }

        // Phone validation (10 digits after removing non-digits)
        const validatePhone = (phone: string, fieldLabel: string): boolean => {
            if (!phone) return true; // optional
            const digits = phone.replace(/\D/g, '');
            if (digits.length !== 10) {
                Alert.alert('Error', `${fieldLabel} must be exactly 10 digits.`);
                return false;
            }
            return true;
        };

        if (!validatePhone(formData.phone, 'Phone number')) return;
        if (!validatePhone(formData.parentPhone, "Parent's phone")) return;
        if (!validatePhone(formData.emergencyPhone, 'Emergency phone')) return;

        // Email validation (basic)
        const validateEmail = (email: string, fieldLabel: string): boolean => {
            if (!email) return true;
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!regex.test(email)) {
                Alert.alert('Error', `${fieldLabel} is invalid.`);
                return false;
            }
            return true;
        };

        if (!validateEmail(formData.parentEmail, 'Parent email')) return;
        if (!validateEmail(formData.emergencyEmail, 'Emergency email')) return;

        try {
            setIsSubmitting(true);
            const payload: any = {
                name: formData.name,
                dateOfBirth: formData.dob || undefined,
                gender: formData.gender || undefined,
                address: formData.address || undefined,
                phone: formData.phone ? `${formData.countryCode} ${formData.phone}`.trim() : undefined,
                rollNo: formData.rollNo || undefined,
                parentName: formData.parentName || undefined,
                parentPhone: formData.parentPhone ? `${formData.parentCountryCode} ${formData.parentPhone}`.trim() : undefined,
                parentEmail: formData.parentEmail || undefined,
                parentRelationship: formData.parentRelationship || undefined,
                emergencyName: formData.emergencyName || undefined,
                emergencyPhone: formData.emergencyPhone ? `${formData.emergencyCountryCode} ${formData.emergencyPhone}`.trim() : undefined,
                emergencyEmail: formData.emergencyEmail || undefined,
                emergencyRelationship: formData.emergencyRelationship || undefined,
            };

            // Remove undefined fields
            Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

            await principalService.updateStudent(studentId, payload);
            Alert.alert('Success', 'Student details updated successfully.', [
                { text: 'Done', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Update Failed', getApiErrorMessage(error) || 'Failed to update student details.');
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, studentId, navigation]);

    if (isLoading) {
        return (
            <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="dark-content" backgroundColor="#FAFAFF" translucent />

            {/* Header */}
            <View style={styles.globalHeader}>
                <ScaleButton onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#1F2937" />
                </ScaleButton>
                <Text style={styles.headerTitle} numberOfLines={1}>Edit Student</Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}>
                        <View style={styles.avatarHeader}>
                            <Text style={styles.avatarTextHeader}>{authState.user?.name?.charAt(0) || 'A'}</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    <View style={styles.pageHeader}>
                        <Text style={styles.screenTitle}>Update Student</Text>
                        <Text style={styles.screenSubtitle}>Update information for {formData.name}</Text>
                    </View>

                    {/* Immutable Fields */}
                    <View style={styles.formSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Immutable Fields</Text>
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>STUDENT ID</Text>
                            <TextInput style={styles.immutableInput} value={studentId} editable={false} />
                        </View>
                        <View style={styles.field}>
                            <Text style={styles.label}>EMAIL</Text>
                            <TextInput style={styles.immutableInput} value={studentEmail} editable={false} />
                        </View>
                    </View>

                    {/* Personal Information */}
                    <View style={styles.formSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Personal Information</Text>
                        </View>
                        <FormField required label="Full Name" value={formData.name} onChangeText={(v: any) => updateForm('name', v)} placeholder="Full Name" />
                        <FormField label="Admission / Roll No" value={formData.rollNo} onChangeText={(v: any) => updateForm('rollNo', v)} placeholder="Admission number" />
                        <View style={styles.inputRow}>
                            <FormField style={{ marginRight: 6 }} label="Date of Birth" value={formData.dob} onPress={handleOpenDatePicker} placeholder="mm/dd/yyyy" />
                            <FormField style={{ marginLeft: 6 }} label="Gender" value={formData.gender} onPress={() => handleOpenSelection('Gender', 'gender', ['Male', 'Female', 'Other'])} placeholder="Select Gender" />
                        </View>
                    </View>

                    {/* Contact Information */}
                    <View style={styles.formSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Contact Information</Text>
                        </View>
                        <FormField
                            label="Phone Number"
                            value={formData.phone}
                            onChangeText={(v: any) => updateForm('phone', v)}
                            placeholder="Enter phone number"
                            keyboardType="default"
                            countryCode={formData.countryCode}
                            onCountryCodePress={() => handleOpenSelection('Country Code', 'countryCode', COUNTRIES.map(c => `${c.name} ${c.code}`))}
                        />
                        <FormField label="Address" value={formData.address} onChangeText={(v: any) => updateForm('address', v)} placeholder="Enter full address" />
                    </View>

                    {/* Parent/Guardian Information */}
                    <View style={styles.formSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Parent / Guardian Information</Text>
                        </View>
                        <FormField label="Parent Name" value={formData.parentName} onChangeText={(v: any) => updateForm('parentName', v)} placeholder="Enter Parent name" />
                        <FormField
                            label="Parent Phone"
                            value={formData.parentPhone}
                            onChangeText={(v: any) => updateForm('parentPhone', v)}
                            placeholder="Enter parent phone number"
                            keyboardType="default"
                            countryCode={formData.parentCountryCode}
                            onCountryCodePress={() => handleOpenSelection('Parent Country Code', 'parentCountryCode', COUNTRIES.map(c => `${c.name} ${c.code}`))}
                        />
                        <FormField label="Parent Email" value={formData.parentEmail} onChangeText={(v: any) => updateForm('parentEmail', v)} placeholder="Enter parent email" keyboardType="email-address" />
                        <FormField label="Relationship" value={formData.parentRelationship} onPress={() => handleOpenSelection('Relationship', 'parentRelationship', ['Father', 'Mother', 'Guardian', 'Other'])} placeholder="Select Relationship" />
                    </View>

                    {/* Emergency Contact */}
                    <View style={styles.formSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Emergency Contact</Text>
                        </View>
                        <FormField label="Contact Name" value={formData.emergencyName} onChangeText={(v: any) => updateForm('emergencyName', v)} placeholder="Emergency contact name" />
                        <FormField
                            label="Contact Phone"
                            value={formData.emergencyPhone}
                            onChangeText={(v: any) => updateForm('emergencyPhone', v)}
                            placeholder="Emergency phone number"
                            keyboardType="default"
                            countryCode={formData.emergencyCountryCode}
                            onCountryCodePress={() => handleOpenSelection('Emergency Country Code', 'emergencyCountryCode', COUNTRIES.map(c => `${c.name} ${c.code}`))}
                        />
                        <FormField label="Contact Email" value={formData.emergencyEmail} onChangeText={(v: any) => updateForm('emergencyEmail', v)} placeholder="Emergency email" keyboardType="email-address" />
                        <FormField label="Relationship" value={formData.emergencyRelationship} onPress={() => handleOpenSelection('Emergency Relationship', 'emergencyRelationship', ['Father', 'Mother', 'Uncle', 'Aunt', 'Other'])} placeholder="Select Relationship" />
                    </View>

                    {/* Form Actions */}
                    <View style={styles.footerActions}>
                        <TouchableOpacity style={[styles.cancelBtn, { marginRight: 10 }]} onPress={() => navigation.goBack()}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.primarySubmitBtn, isSubmitting && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primarySubmitText}>Save Changes</Text>}
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>

            {showDatePicker && DateTimePicker && (
                <DateTimePicker
                    value={(() => {
                        if (formData.dob) {
                            const d = new Date(formData.dob);
                            return isNaN(d.getTime()) ? new Date() : d;
                        }
                        return new Date();
                    })()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                />
            )}

            <SelectionModal
                visible={selectionConfig.visible}
                title={selectionConfig.title}
                options={selectionConfig.options}
                onSelect={handleSelectOption}
                onClose={() => setSelectionConfig(prev => ({ ...prev, visible: false }))}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#FAFAFF' },
    container: { flex: 1 },
    scrollContent: { paddingBottom: 60 },

    // Header
    globalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 24,
        backgroundColor: '#FAFAFF',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', flex: 1, textAlign: 'center', marginHorizontal: 10 },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    avatarHeader: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    avatarTextHeader: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

    pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 4 },
    screenTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 4, letterSpacing: -0.5 },
    screenSubtitle: { fontSize: 12, color: '#6B7280', fontWeight: '400', lineHeight: 18 },

    // Form Sections
    formSection: { paddingHorizontal: 20, marginTop: 8, marginBottom: 20 },
    sectionHeader: { marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },

    field: { flex: 1, marginBottom: 14 },
    label: { fontSize: 10, fontWeight: '800', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    premiumInput: { backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14, height: 46, fontSize: 14, color: '#1F2937', fontWeight: '500', borderWidth: 1, borderColor: '#E2E8F0' },
    premiumInputText: { fontSize: 14, color: '#1F2937', fontWeight: '500' },
    immutableInput: { backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 14, height: 46, fontSize: 14, color: '#64748B', fontWeight: '500', borderWidth: 1, borderColor: '#E2E8F0' },
    countryCodePicker: { width: 70, height: 46, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    countryCodeText: { fontSize: 13, fontWeight: '600', color: '#1F2937', marginRight: 4 },
    inputRow: { flexDirection: 'row' },

    // Footer Actions
    footerActions: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    cancelBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
    cancelBtnText: { color: '#1F2937', fontWeight: '700', fontSize: 13 },
    primarySubmitBtn: { flex: 1.5, backgroundColor: '#3B82F6', height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    primarySubmitText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

});

export default PrincipalEditStudentScreen;