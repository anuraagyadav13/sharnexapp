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
import { useTheme } from '../../store/ThemeContext';
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

const PrincipalEditStudentScreen = ({ navigation, route }: any) => {
    const { authState } = useAuth();
    const { theme, isDarkMode } = useTheme();
    const styles = getStyles(theme, isDarkMode);

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
                        <Ionicons name="caret-down" size={10} color={theme.subtext} />
                    </TouchableOpacity>
                )}
                {onPress && editable ? (
                    <TouchableOpacity
                        style={[styles.premiumInput, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                        onPress={onPress}
                    >
                        <Text style={[styles.premiumInputText, !value && { color: theme.subtext }]}>
                            {value || placeholder}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color={theme.subtext} />
                    </TouchableOpacity>
                ) : (
                    <TextInput
                        style={[styles.premiumInput, { flex: 1 }]}
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        placeholderTextColor={theme.subtext}
                        keyboardType={keyboardType}
                        editable={editable}
                    />
                )}
            </View>
        </View>
    );

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
        const fetchStudentDetails = async () => {
            try {
                const response = await principalService.getStudentDetail(studentId);
                const data = response.data?.student || (response.data as any)?.data || response.data;
                if (!isMounted || !data) return;

                const phoneInfo = extractPhoneCode(data.phone || '');
                const parentPhoneInfo = extractPhoneCode(data.guardianPhone || data.parentPhoneNumber || '');
                const emergencyPhoneInfo = extractPhoneCode(data.emergencyContactPhone || data.emergencyPhone || '');

                setStudentEmail(data.email || '');

                setFormData({
                    name: data.name || '',
                    dob: formatDate(data.dateOfBirth),
                    gender: data.gender || '',
                    rollNo: data.rollNumber || data.admissionNumber || data.rollNo || '',
                    phone: phoneInfo.number,
                    countryCode: phoneInfo.code,
                    address: data.address || '',

                    parentName: data.guardianName || data.parentGuardianName || data.parentName || '',
                    parentPhone: parentPhoneInfo.number,
                    parentCountryCode: parentPhoneInfo.code,
                    parentEmail: data.guardianEmail || data.parentEmail || '',
                    parentRelationship: data.guardianRelation || data.parentRelationship || '',

                    emergencyName: data.emergencyContactName || data.emergencyName || '',
                    emergencyPhone: emergencyPhoneInfo.number,
                    emergencyCountryCode: emergencyPhoneInfo.code,
                    emergencyEmail: data.emergencyContactEmail || data.emergencyEmail || '',
                    emergencyRelationship: data.emergencyContactRelation || data.emergencyRelationship || '',
                });
            } catch (error) {
                console.error('Failed to fetch student details:', error);
                Alert.alert('Error', 'Failed to load student details.');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchStudentDetails();
        return () => { isMounted = false; };
    }, [studentId, extractPhoneCode, formatDate]);

    const updateForm = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleOpenDatePicker = () => {
        setShowDatePicker(true);
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (event.type === 'set' && selectedDate) {
            const yyyy = selectedDate.getFullYear();
            const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const dd = String(selectedDate.getDate()).padStart(2, '0');
            const formatted = `${yyyy}-${mm}-${dd}`;
            updateForm('dob', formatted);
        }

        if (Platform.OS === 'ios' && event.type === 'dismissed') {
            setShowDatePicker(false);
        }
    };

    const handleOpenSelection = (title: string, field: string, options: string[]) => {
        setSelectionConfig({ visible: true, title, field, options });
    };

    const handleSelectOption = (option: string) => {
        if (selectionConfig.field.includes('CountryCode')) {
            const code = option.split(' ').pop() || option;
            updateForm(selectionConfig.field, code);
        } else {
            updateForm(selectionConfig.field, option);
        }
        setSelectionConfig(prev => ({ ...prev, visible: false }));
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            Alert.alert('Required Fields', 'Full Name is required.');
            return;
        }

        try {
            setIsSubmitting(true);
            const payload = {
                name: formData.name,
                dateOfBirth: formData.dob || undefined,
                gender: formData.gender || undefined,
                rollNumber: formData.rollNo || undefined,
                phone: formData.phone ? `${formData.countryCode} ${formData.phone}`.trim() : undefined,
                address: formData.address || undefined,

                parentGuardianName: formData.parentName || undefined,
                parentPhoneNumber: formData.parentPhone ? `${formData.parentCountryCode} ${formData.parentPhone}`.trim() : undefined,
                parentEmail: formData.parentEmail || undefined,
                parentRelationship: formData.parentRelationship || undefined,

                emergencyName: formData.emergencyName || undefined,
                emergencyPhone: formData.emergencyPhone ? `${formData.emergencyCountryCode} ${formData.emergencyPhone}`.trim() : undefined,
                emergencyEmail: formData.emergencyEmail || undefined,
                emergencyRelationship: formData.emergencyRelationship || undefined,
            };

            await principalService.updateStudent(studentId, payload);
            Alert.alert('Success', 'Student details updated successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            console.error('Failed to update student:', error);
            Alert.alert('Update Failed', getApiErrorMessage(error) || 'Failed to update student details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.mainContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#8B5CF6" />
            </View>
        );
    }

    return (
        <View style={styles.mainContainer}>
            <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
                translucent
            />

            {/* Header */}
            <View style={styles.globalHeader}>
                <ScaleButton onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color={theme.text} />
                </ScaleButton>
                <Text style={styles.headerTitle} numberOfLines={1}>Edit Student Profile</Text>
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
                        <Text style={styles.screenTitle}>Modify Records</Text>
                        <Text style={styles.screenSubtitle}>Update personal, guardian, or emergency contact data for {formData.name || 'Student'}.</Text>
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
                        <FormField label="Email" value={studentEmail} placeholder="Email" editable={false} />
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

const getStyles = (theme: any, isDarkMode: boolean) =>
    StyleSheet.create({
        mainContainer: { flex: 1, backgroundColor: theme.background },
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
            backgroundColor: theme.background,
        },
        headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text, flex: 1, textAlign: 'center', marginHorizontal: 10 },
        headerRight: { flexDirection: 'row', alignItems: 'center' },
        avatarHeader: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
        avatarTextHeader: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

        pageHeader: { marginBottom: 20, paddingHorizontal: 20, marginTop: 4 },
        screenTitle: { fontSize: 24, fontWeight: '800', color: theme.text, marginBottom: 4, letterSpacing: -0.5 },
        screenSubtitle: { fontSize: 12, color: theme.subtext, fontWeight: '400', lineHeight: 18 },

        // Form Sections
        formSection: { paddingHorizontal: 20, marginTop: 8, marginBottom: 20 },
        sectionHeader: { marginBottom: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
        sectionTitle: { fontSize: 15, fontWeight: '800', color: theme.text, letterSpacing: -0.3 },

        field: { flex: 1, marginBottom: 14 },
        label: { fontSize: 10, fontWeight: '800', color: theme.subtext, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
        premiumInput: { backgroundColor: theme.surface, borderRadius: 12, paddingHorizontal: 14, height: 46, fontSize: 14, color: theme.text, fontWeight: '500', borderWidth: 1, borderColor: theme.border },
        premiumInputText: { fontSize: 14, color: theme.text, fontWeight: '500' },
        immutableInput: { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderRadius: 12, paddingHorizontal: 14, height: 46, fontSize: 14, color: theme.subtext, fontWeight: '500', borderWidth: 1, borderColor: theme.border },
        countryCodePicker: { width: 70, height: 46, backgroundColor: theme.surface, borderRadius: 12, borderWidth: 1, borderColor: theme.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
        countryCodeText: { fontSize: 13, fontWeight: '600', color: theme.text, marginRight: 4 },
        inputRow: { flexDirection: 'row' },

        // Footer Actions
        footerActions: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 10, paddingTop: 20, borderTopWidth: 1, borderTopColor: theme.border },
        cancelBtn: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.surface },
        cancelBtnText: { color: theme.text, fontWeight: '700', fontSize: 13 },
        primarySubmitBtn: { flex: 1.5, backgroundColor: '#3B82F6', height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
        primarySubmitText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

    });

export default PrincipalEditStudentScreen;