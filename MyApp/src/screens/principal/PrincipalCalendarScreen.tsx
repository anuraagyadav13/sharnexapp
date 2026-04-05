import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  TextInput
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { NavigationDrawer } from '../../components/NavigationDrawer';
import ScaleButton from '../../components/animations/ScaleButton';

type PrincipalCalendarNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PrincipalCalendar'>;

interface Props {
  navigation: PrincipalCalendarNavigationProp;
}

const DUMMY_TERMS = [
  { title: 'First Term', date: 'Aug 26 - Dec 20, 2024', days: '75 Days' },
  { title: 'First Term', date: 'Aug 26 - Dec 20, 2024', days: '75 Days' },
  { title: 'First Term', date: 'Aug 26 - Dec 20, 2024', days: '75 Days' },
];

const DUMMY_HOLIDAYS = [
  { title: 'Winter Break', date: 'Dec 23, 2024 - Jan 3, 2025', count: '10' },
  { title: 'Winter Break', date: 'Dec 23, 2024 - Jan 3, 2025', count: '10' },
  { title: 'Winter Break', date: 'Dec 23, 2024 - Jan 3, 2025', count: '10' },
];

const DUMMY_EXAMS = [
  { term: 'First-Term', date: 'Apr 8 - 12, 2025', marks: '20', subjects: 'All Subjects', duration: '5 Days' },
  { term: 'First-Term', date: 'Apr 8 - 12, 2025', marks: '20', subjects: 'All Subjects', duration: '5 Days' },
  { term: 'First-Term', date: 'Apr 8 - 12, 2025', marks: '20', subjects: 'All Subjects', duration: '5 Days' },
];

const PrincipalCalendarScreen: React.FC<Props> = ({ navigation }) => {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  
  // Modal states
  const [isEventModalVisible, setEventModalVisible] = useState(false);
  const [isHolidayModalVisible, setHolidayModalVisible] = useState(false);
  const [isExamModalVisible, setExamModalVisible] = useState(false);

  // Selection states
  const [selectedEventType, setSelectedEventType] = useState('Academic');
  const [selectedEventGrade, setSelectedEventGrade] = useState('All Grades');
  const [selectedHolidayType, setSelectedHolidayType] = useState('National Holiday');
  const [selectedExamType, setSelectedExamType] = useState('Mid-Term');
  const [selectedExamGrade, setSelectedExamGrade] = useState('K-5');

  // Calendar states
  const [pickerState, setPickerState] = useState<{modal: string, field: string} | null>(null);
  const [eventStartDate, setEventStartDate] = useState('');
  const [eventEndDate, setEventEndDate] = useState('');
  const [holidayStartDate, setHolidayStartDate] = useState('');
  const [holidayEndDate, setHolidayEndDate] = useState('');
  const [examStartDate, setExamStartDate] = useState('');
  const [examEndDate, setExamEndDate] = useState('');

  const handleDateSelect = (day: number) => {
    const formattedDate = `03/${day.toString().padStart(2, '0')}/2025`;
    if (!pickerState) return;
    
    if (pickerState.modal === 'Event') {
      if (pickerState.field === 'start') setEventStartDate(formattedDate);
      else setEventEndDate(formattedDate);
    } else if (pickerState.modal === 'Holiday') {
      if (pickerState.field === 'start') setHolidayStartDate(formattedDate);
      else setHolidayEndDate(formattedDate);
    } else if (pickerState.modal === 'Exam') {
       // Mocking time for exam
      if (pickerState.field === 'start') setExamStartDate(formattedDate + ' 10:00 AM');
      else setExamEndDate(formattedDate + ' 12:30 PM');
    }
    setPickerState(null);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" translucent={false} />

      {/* Top Standard Header */}
      <View style={styles.topHeader}>
        <ScaleButton
          style={styles.menuHandle}
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
          scaleTo={0.85}
        >
          <Ionicons name="menu" size={26} color="#111827" />
        </ScaleButton>

        <Text style={styles.topHeaderTitle} numberOfLines={1}>
          Welcome back, Anurag
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtnTransparent}><Ionicons name="notifications-outline" size={20} color="#111827" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent} onPress={() => navigation.navigate('AccountSettings')}><Ionicons name="settings-outline" size={20} color="#111827" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtnTransparent}><Ionicons name="moon-outline" size={20} color="#111827" /></TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('AccountSettings')}><View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Page Titles */}
        <View style={styles.pageTitleContainer}>
          <Text style={styles.pageTitle}>School Calendar 2024-2025</Text>
          <Text style={styles.pageSubtitle}>Academic schedule, holidays, exams & school events.</Text>
        </View>

        {/* 1. School Year Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="home" size={18} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>School Year 2024-2025</Text>
        </View>

        <Animated.View entering={FadeInUp.duration(300)} style={styles.card}>
          <View style={styles.academicHeader}>
            <Text style={styles.academicHeaderText}>Academic Overview</Text>
          </View>
          {DUMMY_TERMS.map((item, index) => (
            <View key={index} style={[styles.termRow, index === DUMMY_TERMS.length - 1 && { borderBottomWidth: 0 }]}>
              <View>
                <Text style={styles.termTitle}>{item.title}</Text>
                <Text style={styles.termDate}>{item.date}</Text>
              </View>
              <View style={styles.daysBadge}>
                <Text style={styles.daysBadgeText}>{item.days}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* 2. Upcoming Events Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="megaphone" size={18} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          <View style={styles.countBadge}><Text style={styles.countBadgeText}>6 events</Text></View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.newBtn} onPress={() => setEventModalVisible(true)}>
            <Text style={styles.newBtnText}>+ New Event</Text>
          </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInUp.duration(400)} style={styles.eventCard}>
          <Text style={styles.eventTitle}>Science Fair</Text>
          <Text style={styles.eventDate}>March 25, 2025</Text>
          <Text style={styles.eventDesc}>Annual School science fair showcasing students projects.</Text>
          <View style={styles.eventTagsRow}>
            <View style={styles.eventTag}><Text style={styles.eventTagText}>K-5</Text></View>
            <View style={styles.eventTag}><Text style={styles.eventTagText}>6-8</Text></View>
          </View>
        </Animated.View>

        {/* 3. School Holidays Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="umbrella" size={18} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>School Holidays</Text>
          <View style={styles.countBadge}><Text style={styles.countBadgeText}>3 Holidays</Text></View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.newBtn} onPress={() => setHolidayModalVisible(true)}>
            <Text style={styles.newBtnText}>+ New Holiday</Text>
          </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInUp.duration(500)}>
          {DUMMY_HOLIDAYS.map((item, index) => (
            <View key={index} style={styles.holidayCard}>
              <View>
                <Text style={styles.holidayTitle}>{item.title}</Text>
                <Text style={styles.holidayDate}>{item.date}</Text>
              </View>
              <View style={styles.holidayBox}>
                <Text style={styles.holidayBoxNum}>{item.count}</Text>
                <Text style={styles.holidayBoxText}>Days</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* 4. Exam Schedule Section */}
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text" size={18} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Exam Schedule</Text>
          <View style={styles.countBadge}><Text style={styles.countBadgeText}>3 Holidays</Text></View>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.newBtn} onPress={() => setExamModalVisible(true)}>
            <Text style={styles.newBtnText}>+ New Exam</Text>
          </TouchableOpacity>
        </View>

        <Animated.View entering={FadeInUp.duration(600)}>
          {DUMMY_EXAMS.map((item, index) => (
            <View key={index} style={styles.card}>
              <View style={styles.examTopRow}>
                <View style={styles.examPill}>
                  <Text style={styles.examPillText}>{item.term}</Text>
                </View>
                <Text style={styles.examDateRight}>{item.date}</Text>
              </View>
              
              <View style={styles.examStatsRow}>
                <View style={[styles.examStatCol, { flex: 0.8 }]}>
                  <Text style={styles.examStatLabel}>MARKS</Text>
                  <Text style={styles.examStatValue}>{item.marks}</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={[styles.examStatCol, { flex: 1.2 }]}>
                  <Text style={styles.examStatLabel}>Subjects</Text>
                  <Text style={styles.examStatValue}>{item.subjects}</Text>
                </View>
                <View style={styles.verticalDivider} />
                <View style={[styles.examStatCol, { flex: 1 }]}>
                  <Text style={styles.examStatLabel}>Duration</Text>
                  <Text style={styles.examStatValue}>{item.duration}</Text>
                </View>
              </View>
            </View>
          ))}
        </Animated.View>

      </ScrollView>

      {/* Navigation Drawer */}
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} role="principal" />


      {/* --- ADD NEW EVENT MODAL --- */}
      <Modal statusBarTranslucent={true} visible={isEventModalVisible} transparent animationType="fade" onRequestClose={() => setEventModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { backgroundColor: '#1E293B' }]}>
              <Text style={styles.modalTitle}>Add New Event</Text>
              <TouchableOpacity onPress={() => setEventModalVisible(false)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Event Title</Text>
              <TextInput style={styles.textInput} placeholder="e.g., Science Fair" placeholderTextColor="#9CA3AF" />

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TouchableOpacity 
                    style={styles.dateInputWrapper}
                    activeOpacity={0.7}
                    onPress={() => setPickerState({ modal: 'Event', field: 'start' })}
                  >
                    <Text style={[styles.dateInputText, !eventStartDate && { color: '#9CA3AF' }]}>
                      {eventStartDate || 'mm/dd/yyyy'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                  </TouchableOpacity>
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>End Date</Text>
                  <TouchableOpacity 
                    style={styles.dateInputWrapper}
                    activeOpacity={0.7}
                    onPress={() => setPickerState({ modal: 'Event', field: 'end' })}
                  >
                    <Text style={[styles.dateInputText, !eventEndDate && { color: '#9CA3AF' }]}>
                      {eventEndDate || 'mm/dd/yyyy'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.inputLabel}>Event Type</Text>
              <View style={styles.gridContainer}>
                {[
                  { id: 'Academic', icon: 'school' },
                  { id: 'Sports', icon: 'trophy' },
                  { id: 'Parents Meeting', icon: 'people' },
                  { id: 'Special Event', icon: 'star' },
                  { id: 'Culturals', icon: 'happy' },
                  { id: 'Other', icon: 'ellipsis-horizontal' }
                ].map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.gridBox, selectedEventType === item.id && styles.gridBoxSelected]}
                    onPress={() => setSelectedEventType(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={item.icon} size={24} color={selectedEventType === item.id ? '#3B82F6' : '#9CA3AF'} />
                    <Text style={[styles.gridBoxText, selectedEventType === item.id && {color: '#3B82F6'}]}>{item.id}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Grade Levels</Text>
              <View style={styles.pillsRow}>
                {['K-5', '6-8', '9-12', 'All Grades'].map(grade => (
                  <TouchableOpacity
                    key={grade}
                    style={[styles.gradePill, selectedEventGrade === grade && styles.gradePillSelected]}
                    onPress={() => setSelectedEventGrade(grade)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.gradePillText, selectedEventGrade === grade && {color:'#3B82F6'}]}>{grade}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Location</Text>
              <TextInput style={styles.textInput} placeholder="e.g., Main Auditorium" placeholderTextColor="#9CA3AF" />
              
              <Text style={styles.inputLabel}>Event Priority</Text>
              <TextInput style={styles.textInput} placeholder="e.g., High, Medium, Low" placeholderTextColor="#9CA3AF" />

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEventModalVisible(false)}><Text style={styles.modalCancelBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalSaveBtn, {backgroundColor: '#2563EB'}]} onPress={() => setEventModalVisible(false)}><Text style={styles.modalSaveBtnText}>Save Event</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- ADD NEW HOLIDAY MODAL --- */}
      <Modal statusBarTranslucent={true} visible={isHolidayModalVisible} transparent animationType="fade" onRequestClose={() => setHolidayModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { backgroundColor: '#1E293B' }]}>
              <Text style={styles.modalTitle}>Add School Holiday</Text>
              <TouchableOpacity onPress={() => setHolidayModalVisible(false)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Holiday Name</Text>
              <TextInput style={styles.textInput} placeholder="e.g., Winter Break" placeholderTextColor="#9CA3AF" />

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Start Date</Text>
                  <TouchableOpacity 
                    style={styles.dateInputWrapper}
                    activeOpacity={0.7}
                    onPress={() => setPickerState({ modal: 'Holiday', field: 'start' })}
                  >
                    <Text style={[styles.dateInputText, !holidayStartDate && { color: '#9CA3AF' }]}>
                      {holidayStartDate || 'mm/dd/yyyy'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                  </TouchableOpacity>
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>End Date</Text>
                  <TouchableOpacity 
                    style={styles.dateInputWrapper}
                    activeOpacity={0.7}
                    onPress={() => setPickerState({ modal: 'Holiday', field: 'end' })}
                  >
                    <Text style={[styles.dateInputText, !holidayEndDate && { color: '#9CA3AF' }]}>
                      {holidayEndDate || 'mm/dd/yyyy'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.inputLabel}>Holiday Type</Text>
              <View style={styles.gridContainer}>
                {[
                  { id: 'National Holiday', icon: 'flag' },
                  { id: 'Seasonal Break', icon: 'sunny' },
                  { id: 'Religious Holiday', icon: 'business' },
                  { id: 'Emergency Closure', icon: 'warning' },
                  { id: 'School Event', icon: 'calendar' },
                  { id: 'Other', icon: 'calendar-outline' }
                ].map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.gridBox, selectedHolidayType === item.id && styles.gridBoxSelected]}
                    onPress={() => setSelectedHolidayType(item.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={item.icon} size={24} color={selectedHolidayType === item.id ? '#3B82F6' : '#9CA3AF'} />
                    <Text style={[styles.gridBoxText, selectedHolidayType === item.id && {color: '#3B82F6'}]}>{item.id}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput style={styles.textArea} placeholder="Add notes about holiday..." placeholderTextColor="#9CA3AF" multiline />

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setHolidayModalVisible(false)}><Text style={styles.modalCancelBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalSaveBtn, {backgroundColor: '#2563EB'}]} onPress={() => setHolidayModalVisible(false)}><Text style={styles.modalSaveBtnText}>Save Holiday</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- ADD NEW EXAM MODAL --- */}
      <Modal statusBarTranslucent={true} visible={isExamModalVisible} transparent animationType="fade" onRequestClose={() => setExamModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalHeader, { backgroundColor: '#8B5CF6' }]}>
              <Text style={styles.modalTitle}>Add Exam Schedule</Text>
              <TouchableOpacity onPress={() => setExamModalVisible(false)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.inputLabel}>Exam Name</Text>
              <TextInput style={styles.textInput} placeholder="e.g., Mid Term exam..." placeholderTextColor="#9CA3AF" />

              <Text style={styles.inputLabel}>Exam Type</Text>
              <View style={styles.pillsRow}>
                {['Mid-Term', 'Final', 'Quarterly'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.gradePill, selectedExamType === type && { borderColor: '#8B5CF6' }]}
                    onPress={() => setSelectedExamType(type)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.gradePillText, selectedExamType === type && { color: '#8B5CF6' }]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Start Date & Time</Text>
                  <TouchableOpacity 
                    style={styles.dateInputWrapper}
                    activeOpacity={0.7}
                    onPress={() => setPickerState({ modal: 'Exam', field: 'start' })}
                  >
                    <Text style={[styles.dateInputText, !examStartDate && { color: '#9CA3AF' }]} numberOfLines={1}>
                      {examStartDate || 'mm/dd --:--'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                  </TouchableOpacity>
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>End Date & Time</Text>
                  <TouchableOpacity 
                    style={styles.dateInputWrapper}
                    activeOpacity={0.7}
                    onPress={() => setPickerState({ modal: 'Exam', field: 'end' })}
                  >
                    <Text style={[styles.dateInputText, !examEndDate && { color: '#9CA3AF' }]} numberOfLines={1}>
                      {examEndDate || 'mm/dd --:--'}
                    </Text>
                    <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.inputLabel}>Grade Levels</Text>
              <View style={styles.pillsRow}>
                {['K-5', '6-8', '9-12', 'All Grades'].map(grade => (
                  <TouchableOpacity
                    key={grade}
                    style={[styles.gradePill, selectedExamGrade === grade && { borderColor: '#8B5CF6' }]}
                    onPress={() => setSelectedExamGrade(grade)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.gradePillText, selectedExamGrade === grade && { color: '#8B5CF6' }]}>{grade}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Location/Rooms</Text>
              <TextInput style={styles.textInput} placeholder="e.g., Room 101, 102" placeholderTextColor="#9CA3AF" />
              
              <Text style={styles.inputLabel}>Special Instruments</Text>
              <TextInput style={styles.textArea} placeholder="Any special instruments for students and staff?" placeholderTextColor="#9CA3AF" multiline />

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setExamModalVisible(false)}><Text style={styles.modalCancelBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalSaveBtn, {backgroundColor: '#8B5CF6'}]} onPress={() => setExamModalVisible(false)}><Text style={styles.modalSaveBtnText}>Save Exam Schedule</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* --- PURE JAVASCRIPT CALENDAR PICKER --- */}
      <Modal statusBarTranslucent={true} visible={!!pickerState} transparent animationType="fade" onRequestClose={() => setPickerState(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContainer}>
            
            <View style={styles.datePickerHeader}>
              <TouchableOpacity hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Ionicons name="chevron-back" size={20} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.datePickerMonthTitle}>March 2025</Text>
              <TouchableOpacity hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Ionicons name="chevron-forward" size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerDaysRow}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                <Text key={day} style={styles.datePickerDayLabel}>{day}</Text>
              ))}
            </View>

            <View style={styles.datePickerGrid}>
              {/* March 1st 2025 is a Saturday, so 6 empty slots */}
              {Array.from({length: 6}, (_, i) => <View key={`empty-${i}`} style={styles.datePickerDayBtn} />)}
              
              {/* 31 days mapped out */}
              {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                <TouchableOpacity 
                  key={day} 
                  style={[styles.datePickerDayBtn, day === 25 && styles.datePickerDaySelectedBtn]} 
                  onPress={() => handleDateSelect(day)}
                >
                  <Text style={[styles.datePickerDayText, day === 25 && { color: '#FFF', fontWeight: 'bold' }]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.datePickerFooter}>
              <TouchableOpacity onPress={() => setPickerState(null)} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },

  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, 
    paddingBottom: 16,
    backgroundColor: '#FFF',
    zIndex: 10,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  menuHandle: { paddingRight: 4, paddingVertical: 8 }, 
  topHeaderTitle: { fontSize: 18, fontWeight: '500', color: '#4F46E5', flex: 1, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtnTransparent: { justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#A78BFA',
    justifyContent: 'center', alignItems: 'center', marginLeft: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

  pageTitleContainer: {
    marginTop: 20,
    marginBottom: 8,
  },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#3B82F6', marginBottom: 4 },
  pageSubtitle: { color: '#6B7280', fontSize: 11, fontWeight: '500' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  sectionIcon: { marginRight: 8, color: '#111827' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  countBadge: {
    backgroundColor: '#4F46E5', // indigo
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  countBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '600' },
  newBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 10,
    paddingVertical: 14,
    borderRadius: 8,
  },
  newBtnText: { color: '#FFF', fontSize: 10, fontWeight: '600' },

  // Reusable Premium Card Style
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    overflow: 'hidden',
    marginBottom: 20,
  },

  // 1. Academic Overview Specifics
  academicHeader: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  academicHeaderText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  termRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  termTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  termDate: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  daysBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  daysBadgeText: { color: '#4F46E5', fontSize: 10, fontWeight: '600' },

  // 2. Events Specifics
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
    padding: 16,
    width: '60%',
  },
  eventTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  eventDate: { fontSize: 11, color: '#3B82F6', marginTop: 4, marginBottom: 8, fontWeight: '500' },
  eventDesc: { fontSize: 10, color: '#6B7280', lineHeight: 14, marginBottom: 12 },
  eventTagsRow: { flexDirection: 'row', gap: 8 },
  eventTag: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  eventTagText: { color: '#2563EB', fontSize: 9, fontWeight: '600' },

  // 3. Holidays Specifics
  holidayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FDA4AF', // red outline
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  holidayTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  holidayDate: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  holidayBox: { 
    backgroundColor: '#FFE4E6', 
    borderRadius: 6, 
    paddingVertical: 4, 
    paddingHorizontal: 8, 
    alignItems: 'center',
    minWidth: 36,
  },
  holidayBoxNum: { color: '#E11D48', fontSize: 12, fontWeight: '700' },
  holidayBoxText: { color: '#E11D48', fontSize: 8, fontWeight: '600' },

  // 4. Exams Specifics
  examTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 12 },
  examPill: { backgroundColor: '#0EA5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  examPillText: { color: '#FFF', fontSize: 9, fontWeight: '600' },
  examDateRight: { fontSize: 11, fontWeight: '700', color: '#111827' },
  
  examStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 },
  examStatCol: { alignItems: 'flex-start' },
  examStatLabel: { fontSize: 9, color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase' },
  examStatValue: { fontSize: 11, fontWeight: '700', color: '#111827' },
  verticalDivider: { width: 1, height: 28, backgroundColor: '#E5E7EB', marginHorizontal: 12 },

  // --- MODAL STYLES ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalContent: {
    width: '90%',
    maxHeight: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalScroll: {
    padding: 20,
    paddingBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#111827',
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  formCol: {
    flex: 1,
  },
  dateInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFF',
    height: 48,
  },
  dateInputText: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gridBox: {
    width: '31.5%', // Exact width for 3 items per line
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 24,
    marginBottom: 12,
  },
  gridBoxSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
  },
  gridBoxText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  gradePill: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  gradePillSelected: {
    borderColor: '#3B82F6',
  },
  gradePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: '#111827',
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  modalCancelBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  modalCancelBtnText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13,
  },
  modalSaveBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalSaveBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },

  // --- CUSTOM DATE PICKER STYLES ---
  datePickerContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerMonthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  datePickerDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  datePickerDayLabel: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  datePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  datePickerDayBtn: {
    width: '14.28%', 
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8, // makes the selected state circle
  },
  datePickerDaySelectedBtn: {
    backgroundColor: '#3B82F6',
  },
  datePickerDayText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  datePickerFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  datePickerCancelText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },

});

export default PrincipalCalendarScreen;
