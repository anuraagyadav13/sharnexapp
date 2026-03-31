import React from 'react';
import { StatusBar, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/store/AuthContext';
import { RootStackParamList } from './src/types/navigation';
export type { RootStackParamList };

import HomeScreen from './src/screens/auth/HomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import StudentDashboard from './src/screens/student/StudentDashboard';
import AssignmentsScreen from './src/screens/student/AssignmentsScreen';
import AssignmentDetailsScreen from './src/screens/student/AssignmentDetailsScreen';
import AssignmentSubmitScreen from './src/screens/student/AssignmentSubmitScreen';
import AssignmentGradeScreen from './src/screens/student/AssignmentGradeScreen';
import QuizzesScreen from './src/screens/student/QuizzesScreen';
import QuizDetailsScreen from './src/screens/student/QuizDetailsScreen';
import StartQuizScreen from './src/screens/student/StartQuizScreen';
import QuizResultScreen from './src/screens/student/QuizResultScreen';
import ViewQuizDetailScreen from './src/screens/student/ViewQuizDetailScreen';
import PerformanceScreen from './src/screens/student/PerformanceScreen';
import StudyMaterialScreen from './src/screens/student/StudyMaterialScreen';
import AttendanceScreen from './src/screens/student/AttendanceScreen';
import AnnouncementScreen from './src/screens/student/AnnouncementScreen';
import GradesScreen from './src/screens/student/GradesScreen';
import FeesScreen from './src/screens/student/FeesScreen';
import AccountSettingsScreen from './src/screens/shared/AccountSettingsScreen';
import TimetableScreen from './src/screens/student/TimetableScreen';
import TeacherAttendanceScreen from './src/screens/teacher/TeacherAttendanceScreen';
import TeacherViewAttendanceScreen from './src/screens/teacher/TeacherViewAttendanceScreen';
import TeacherMarkAttendanceScreen from './src/screens/teacher/TeacherMarkAttendanceScreen';
import TeacherAssignmentScreen from './src/screens/teacher/TeacherAssignmentScreen';
import TeacherViewSubmissionScreen from './src/screens/teacher/TeacherViewSubmissionScreen';
import TeacherCreateAssignmentScreen from './src/screens/teacher/TeacherCreateAssignmentScreen';
import TeacherQuizScreen from './src/screens/teacher/TeacherQuizScreen';
import TeacherCreateQuizScreen from './src/screens/teacher/TeacherCreateQuizScreen';
import TeacherCreateQuizStep2Screen from './src/screens/teacher/TeacherCreateQuizStep2Screen';
import TeacherAddQuestionScreen from './src/screens/teacher/TeacherAddQuestionScreen';
import TeacherCreateQuizStep3Screen from './src/screens/teacher/TeacherCreateQuizStep3Screen';
import TeacherViewQuizResultScreen from './src/screens/teacher/TeacherViewQuizResultScreen';
import TeacherMonitorLiveScreen from './src/screens/teacher/TeacherMonitorLiveScreen';
import TeacherDashboard from './src/screens/teacher/TeacherDashboard';
import PrincipalDashboard from './src/screens/principal/PrincipalDashboard';
import PrincipalClassesScreen from './src/screens/principal/PrincipalClassesScreen';
import PrincipalSubjectsScreen from './src/screens/principal/PrincipalSubjectsScreen';
import PrincipalStaffScreen from './src/screens/principal/PrincipalStaffScreen';
import PrincipalMarkStaffAttendanceScreen from './src/screens/principal/PrincipalMarkStaffAttendanceScreen';
import PrincipalAddStaffScreen from './src/screens/principal/PrincipalAddStaffScreen';
import PrincipalStudentDetailsScreen from './src/screens/principal/PrincipalStudentDetailsScreen';
import PrincipalAddStudentScreen from './src/screens/principal/PrincipalAddStudentScreen';
import PrincipalCalendarScreen from './src/screens/principal/PrincipalCalendarScreen';
import PrincipalTimetableScreen from './src/screens/principal/PrincipalTimetableScreen';
import PrincipalPerformanceScreen from './src/screens/principal/PrincipalPerformanceScreen';
import PrincipalAnnouncementsScreen from './src/screens/principal/PrincipalAnnouncementsScreen';
import PrincipalFeesScreen from './src/screens/principal/PrincipalFeesScreen';

// Removed redundant RootStackParamList definition as it's now exported from src/types/navigation.ts

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
            screenOptions={{
              headerShown: false,
              animation: 'fade_from_bottom',
            }}
          >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
            <Stack.Screen name="Quizzes" component={QuizzesScreen} />
            <Stack.Screen name="QuizDetails" component={QuizDetailsScreen} />
            <Stack.Screen name="StartQuiz" component={StartQuizScreen} />
            <Stack.Screen name="QuizResult" component={QuizResultScreen} />
            <Stack.Screen name="ViewQuizDetail" component={ViewQuizDetailScreen} />
            <Stack.Screen name="Assignments" component={AssignmentsScreen} />
            <Stack.Screen name="AssignmentDetails" component={AssignmentDetailsScreen} />
            <Stack.Screen name="AssignmentSubmit" component={AssignmentSubmitScreen} />
            <Stack.Screen name="AssignmentGrade" component={AssignmentGradeScreen} />
            <Stack.Screen name="Performance" component={PerformanceScreen} />
            <Stack.Screen name="StudyMaterial" component={StudyMaterialScreen} />
            <Stack.Screen name="Attendance" component={AttendanceScreen} />
            <Stack.Screen name="Announcements" component={AnnouncementScreen} />
            <Stack.Screen name="Grades" component={GradesScreen} />
            <Stack.Screen name="Fees" component={FeesScreen} />
            <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
            <Stack.Screen name="Timetable" component={TimetableScreen} />
            <Stack.Screen name="TeacherAttendance" component={TeacherAttendanceScreen} />
            <Stack.Screen name="TeacherViewAttendance" component={TeacherViewAttendanceScreen} />
            <Stack.Screen name="TeacherMarkAttendance" component={TeacherMarkAttendanceScreen} />
            <Stack.Screen name="TeacherAssignment" component={TeacherAssignmentScreen} />
            <Stack.Screen name="TeacherViewSubmission" component={TeacherViewSubmissionScreen} />
            <Stack.Screen name="TeacherCreateAssignment" component={TeacherCreateAssignmentScreen} />
            <Stack.Screen name="TeacherQuiz" component={TeacherQuizScreen} />
            <Stack.Screen name="TeacherCreateQuiz" component={TeacherCreateQuizScreen} />
            <Stack.Screen name="TeacherCreateQuizStep2" component={TeacherCreateQuizStep2Screen} />
            <Stack.Screen name="TeacherAddQuestion" component={TeacherAddQuestionScreen} />
            <Stack.Screen name="TeacherCreateQuizStep3" component={TeacherCreateQuizStep3Screen} />
            <Stack.Screen name="TeacherViewQuizResult" component={TeacherViewQuizResultScreen} />
            <Stack.Screen name="TeacherMonitorLive" component={TeacherMonitorLiveScreen} />
            <Stack.Screen name="TeacherDashboard" component={TeacherDashboard} />
            <Stack.Screen name="PrincipalDashboard" component={PrincipalDashboard} />
            <Stack.Screen name="PrincipalClasses" component={PrincipalClassesScreen} />
            <Stack.Screen name="PrincipalSubjects" component={PrincipalSubjectsScreen} />
            <Stack.Screen name="PrincipalStaff" component={PrincipalStaffScreen} />
            <Stack.Screen name="PrincipalMarkStaffAttendance" component={PrincipalMarkStaffAttendanceScreen} />
            <Stack.Screen name="PrincipalAddStaff" component={PrincipalAddStaffScreen} />
            <Stack.Screen name="PrincipalStudentDetails" component={PrincipalStudentDetailsScreen} />
            <Stack.Screen name="PrincipalAddStudent" component={PrincipalAddStudentScreen} />
            <Stack.Screen name="PrincipalCalendar" component={PrincipalCalendarScreen} />
            <Stack.Screen name="PrincipalTimetable" component={PrincipalTimetableScreen} />
            <Stack.Screen name="PrincipalPerformance" component={PrincipalPerformanceScreen} />
            <Stack.Screen name="PrincipalAnnouncements" component={PrincipalAnnouncementsScreen} />
            <Stack.Screen name="PrincipalFees" component={PrincipalFeesScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </GestureHandlerRootView>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;