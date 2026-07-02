import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Platform
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../store/AuthContext';
let DocumentPicker: any = null;
let DocumentPickerTypes: any = null;
let XLSX: any = null;

const ensureXLSX = () => {
  if (XLSX) return true;
  try {
    XLSX = require('xlsx');
    return true;
  } catch (error) {
    console.error('XLSX not available:', error);
    return false;
  }
};

type Props = NativeStackScreenProps<RootStackParamList, 'TeacherCreateQuizStep2'>;

const normalizeFilePath = (uri: string) => {
  if (uri.startsWith('file://')) {
    return uri.replace('file://', '');
  }
  return uri;
};

const readFileText = async (uri: string) => {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Unable to read file: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Error reading file text:', error);
    throw error;
  }
};

const readFileBase64 = async (uri: string) => {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Unable to read file: ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }
    if (typeof globalThis.btoa === 'function') {
      return globalThis.btoa(binary);
    }
    throw new Error('Unable to convert file to base64');
  } catch (error) {
    console.error('Error reading file as base64:', error);
    throw error;
  }
};


const TeacherCreateQuizStep2Screen: React.FC<Props> = ({ navigation, route }) => {
  const { authState } = useAuth();
  const { quizData } = route.params;
  const [questions, setQuestions] = useState<any[]>(quizData?.questions || []);
  const [inputMethod, setInputMethod] = useState<'JSON' | 'Excel'>('JSON');
  const [jsonText, setJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [pickerAvailable, setPickerAvailable] = useState(false);
  const [pickerErrorMessage, setPickerErrorMessage] = useState<string | null>(null);
  
  // File picker states
  const [selectedJsonFile, setSelectedJsonFile] = useState<any>(null);
  const [selectedExcelFile, setSelectedExcelFile] = useState<any>(null);

  const ensureDocumentPicker = () => {
    if (DocumentPicker && DocumentPickerTypes) {
      setPickerAvailable(true);
      return;
    }

    try {
      const module = require('react-native-document-picker-v2');
      DocumentPicker = module.default || module;
      DocumentPickerTypes = module.types || module.Types || DocumentPicker?.types || DocumentPicker?.Types || module;
      setPickerAvailable(true);
      setPickerErrorMessage(null);
    } catch (error: any) {
      const message = error?.message || 'Document picker native module is not available.';
      setPickerAvailable(false);
      setPickerErrorMessage(message);
    }
  };

  // Listen for new/edited questions from TeacherAddQuestion
  useEffect(() => {
    ensureDocumentPicker();
    const params = route.params as any;
    if (params?.newQuestion) {
      if (params.editIndex !== undefined && params.editIndex !== null) {
        // Update existing question
        setQuestions(prev => {
          const updated = [...prev];
          updated[params.editIndex] = params.newQuestion;
          return updated;
        });
      } else {
        // Add new question
        setQuestions(prev => [...prev, params.newQuestion]);
      }
      // Clear the params after taking them
      navigation.setParams({ newQuestion: undefined, editIndex: undefined } as any);
    }
  }, [route.params]);

  const pickJsonFile = async () => {
    if (!pickerAvailable) {
      Alert.alert('Error', pickerErrorMessage || 'File picker is not available in this build.');
      return;
    }

    try {
      ensureDocumentPicker();
      if (!DocumentPicker || !DocumentPickerTypes) {
        throw new Error('File picker module not loaded');
      }
      console.log('Opening JSON file picker...');
      const result = await DocumentPicker.pick({
        type: [DocumentPickerTypes.json],
        allowMultiSelection: false,
      });
      
      console.log('File picked:', result);
      if (result && result[0]) {
        // Check file size (limit to 5MB)
        if (result[0].size && result[0].size > 5 * 1024 * 1024) {
          Alert.alert('Error', 'File size too large. Please select a file smaller than 5MB.');
          return;
        }
        setSelectedJsonFile(result[0]);
        console.log('JSON file selected:', result[0].name);
      }
    } catch (err: any) {
      console.log('File picker error:', err);
      const message = err?.message || 'Failed to pick file';
      if (message.includes('native module') || message.includes('not loaded')) {
        setPickerAvailable(false);
        setPickerErrorMessage(message);
      }
      if (!DocumentPicker?.isCancel?.(err)) {
        Alert.alert('Error', message);
        console.error('File picker error:', err);
      }
    }
  };

  const pickExcelFile = async () => {
    if (!pickerAvailable) {
      Alert.alert('Error', pickerErrorMessage || 'File picker is not available in this build.');
      return;
    }

    try {
      ensureDocumentPicker();
      if (!DocumentPicker || !DocumentPickerTypes) {
        throw new Error('File picker module not loaded');
      }
      console.log('Opening Excel file picker...');
      const result = await DocumentPicker.pick({
        type: [DocumentPickerTypes.xlsx, DocumentPickerTypes.xls],
        allowMultiSelection: false,
      });
      
      console.log('File picked:', result);
      if (result && result[0]) {
        // Check file size (limit to 5MB)
        if (result[0].size && result[0].size > 5 * 1024 * 1024) {
          Alert.alert('Error', 'File size too large. Please select a file smaller than 5MB.');
          return;
        }
        setSelectedExcelFile(result[0]);
        console.log('Excel file selected:', result[0].name);
      }
    } catch (err) {
      console.log('File picker error:', err);
      const message = (err as any)?.message || 'Failed to pick file';
      if (message.includes('native module') || message.includes('not loaded')) {
        setPickerAvailable(false);
        setPickerErrorMessage(message);
      }
      if (!DocumentPicker?.isCancel?.(err)) {
        Alert.alert('Error', message);
        console.error('File picker error:', err);
      }
    }
  };

  const handleImportJSON = async () => {
    let jsonData = jsonText.trim();
    
    // If a file is selected, read from file
    if (selectedJsonFile) {
      try {
        console.log('Reading JSON file:', selectedJsonFile.uri);
        jsonData = await readFileText(selectedJsonFile.uri);
        console.log('JSON file content length:', jsonData.length);
      } catch (error: any) {
        console.error('File read error:', error);
        Alert.alert('Error', `Failed to read JSON file: ${error.message || 'Unknown error'}`);
        return;
      }
    } else if (!jsonData) {
      Alert.alert('Error', 'Please enter JSON data or select a JSON file');
      return;
    }
    
    try {
      setIsImporting(true);
      
      // Attempt to clean the JSON string if it looks like it has common issues
      let cleanedJson = jsonData.trim();
      
      // Fix common issue: missing outer brackets if user pasted just a list of objects
      if (cleanedJson.startsWith('{') && !cleanedJson.startsWith('[')) {
        cleanedJson = '[' + cleanedJson + ']';
      }
      
      // Fix common issue: single quotes instead of double quotes (very basic fix)
      if (cleanedJson.includes("'") && !cleanedJson.includes('"')) {
        cleanedJson = cleanedJson.replace(/'/g, '"');
      }

      let parsedQuestions;
      try {
        parsedQuestions = JSON.parse(cleanedJson);
      } catch (parseErr) {
        console.warn('JSON Parse Warning:', parseErr);
        throw new Error('Invalid JSON format. Please ensure you use double quotes (") for keys and values.\n\nNote: JSON must be an array of objects like:\n[{"text":"Quest 1", "options":[...], "correctAnswer":"A"}]');
      }

      if (!Array.isArray(parsedQuestions)) {
        throw new Error('The imported data must be an array of questions (wrapped in [ ]).');
      }
      
      const importedQuestions = parsedQuestions.map((item: any, index: number) => {
        if (typeof item !== 'object' || !item) {
          throw new Error(`Question at index ${index} is invalid`);
        }

        const rawOptions = item.options || item.answers || item.choices || [];
        const optionsList = Array.isArray(rawOptions) ? rawOptions : [];
        
        // Transform list to { letter, value } format if it's just strings
        const options = optionsList.map((opt: any, i: number) => {
          if (typeof opt === 'string') {
            return { letter: ['A', 'B', 'C', 'D', 'E', 'F'][i], value: opt };
          }
          return {
            letter: opt.letter || ['A', 'B', 'C', 'D', 'E', 'F'][i],
            value: opt.value || opt.text || String(opt)
          };
        });

        const rawCorrect = item.answer ?? item.correctAnswer ?? item.correct_answer ?? item.correct_option ?? null;
        let correctAnswer: string | null = null;

        if (typeof rawCorrect === 'number') {
          correctAnswer = ['A', 'B', 'C', 'D', 'E', 'F'][rawCorrect - 1] ?? null;
        } else if (typeof rawCorrect === 'string') {
          const trimmed = rawCorrect.trim();
          if (/^[1-6]$/.test(trimmed)) {
            correctAnswer = ['A', 'B', 'C', 'D', 'E', 'F'][parseInt(trimmed, 10) - 1];
          } else if (/^[A-F]$/i.test(trimmed)) {
            correctAnswer = trimmed.toUpperCase();
          } else {
            // Try to find matching value in options
            const optIndex = options.findIndex(o => o.value.toLowerCase() === trimmed.toLowerCase());
            if (optIndex !== -1) {
              correctAnswer = options[optIndex].letter;
            }
          }
        }

        return {
          text: item.question || item.prompt || item.text || `Question ${index + 1}`,
          options,
          correctAnswer,
          points: item.points || 5,
        };
      });
      
      if (importedQuestions.length === 0) {
        throw new Error('No valid questions found in JSON');
      }
      
      setQuestions(prev => [...prev, ...importedQuestions]);
      setJsonText('');
      setSelectedJsonFile(null);
      Alert.alert('Success', `Imported ${importedQuestions.length} questions successfully`);
    } catch (error: any) {
      console.warn('Import Warning:', error);
      Alert.alert('Import Warning', error.message || 'Failed to parse the data. Please check the format.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportExcel = async () => {
    if (!selectedExcelFile) {
      Alert.alert('Error', 'Please select an Excel file first');
      return;
    }
    
    try {
      setIsImporting(true);
      
      if (!ensureXLSX()) {
        Alert.alert('Error', 'Excel processing library is not available in this build.');
        return;
      }
      
      // Read the Excel file
      console.log('Reading Excel file:', selectedExcelFile.uri);
      let fileDataBase64: string;
      try {
        fileDataBase64 = await readFileBase64(selectedExcelFile.uri);
        console.log('Excel file base64 size:', fileDataBase64.length);
      } catch (error: any) {
        console.error('Excel file read error:', error);
        Alert.alert('Error', `Failed to read Excel file: ${error.message || 'Unknown error'}`);
        return;
      }
      
      // Parse Excel file
      console.log('Parsing Excel data...');
      const workbook = XLSX.read(fileDataBase64, { type: 'base64' });
      console.log('Workbook sheets:', workbook.SheetNames);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log('Parsed rows:', jsonData.length);
      
      if (jsonData.length < 2) {
        throw new Error('Excel file must have at least a header row and one data row');
      }
      
      // Validate headers
      const headers = jsonData[0] as string[];
      const requiredHeaders = ['question', 'option_1', 'option_2', 'correct_option'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
      }
      
      // Convert to question format
      const questions: any[] = [];
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (row.length < 4) continue; // Skip incomplete rows
        
        const question = row[headers.indexOf('question')];
        const option1 = row[headers.indexOf('option_1')];
        const option2 = row[headers.indexOf('option_2')];
        const correctOption = parseInt(row[headers.indexOf('correct_option')]);
        
        if (!question || !option1 || !option2 || isNaN(correctOption) || correctOption < 1 || correctOption > 4) {
          continue; // Skip invalid rows
        }
        
        // Get all options (support up to 4)
        const options = [option1, option2];
        if (headers.includes('option_3') && row[headers.indexOf('option_3')]) {
          options.push(row[headers.indexOf('option_3')]);
        }
        if (headers.includes('option_4') && row[headers.indexOf('option_4')]) {
          options.push(row[headers.indexOf('option_4')]);
        }
        
        // Map correct option to letter
        const correctLetter = ['A', 'B', 'C', 'D'][correctOption - 1];
        
        // Transform options to object format
        const optionsObjects = options.map((val, idx) => ({
          letter: ['A', 'B', 'C', 'D'][idx],
          value: String(val)
        }));

        questions.push({
          text: question,
          options: optionsObjects,
          correctAnswer: correctLetter,
          points: 5
        });
      }
      
      if (questions.length === 0) {
        throw new Error('No valid questions found in the Excel file');
      }
      
      setQuestions(prev => [...prev, ...questions]);
      setSelectedExcelFile(null);
      Alert.alert('Success', `Imported ${questions.length} questions successfully`);
    } catch (error: any) {
      console.error('Excel import error:', error);
      Alert.alert('Error', error.message || 'Failed to import Excel file');
    } finally {
      setIsImporting(false);
    }
  };

  const handleNext = () => {
    if (questions.length === 0) {
      Alert.alert('Error', 'Please add at least one question');
      return;
    }
    navigation.navigate('TeacherCreateQuizStep3', {
      quizData: {
        ...quizData,
        questions
      }
    });
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* Global Header */}
      <View style={styles.globalHeader}>
        <View style={styles.menuHandle} />
        <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>Welcome back, {authState.user?.name?.split(' ')[0] || 'Teacher'}</Text>
        <View style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={22} color="#1F2937" />
          <Ionicons name="settings-outline" size={22} color="#1F2937" />
          <Ionicons name="moon-outline" size={22} color="#1F2937" />
          <View style={styles.avatar}>
             <Text style={styles.avatarText}>{authState.user?.name?.charAt(0) || 'T'}</Text>
          </View>
        </View>
      </View>

      {/* Blue Header Section */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.blueHeader}>
         <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
         </TouchableOpacity>
         <Text style={styles.blueTitle}>{quizData?.id ? 'Edit Quiz' : 'Create New Quiz'}</Text>
         <Text style={styles.blueSubtitle}>Design and configure your Quiz</Text>
      </Animated.View>

      {/* Stepper */}
      <View style={styles.stepperContainer}>
         <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCircleCompleted]}>
               <Text style={[styles.stepNumber, styles.stepNumberActive]}>1</Text>
            </View>
            <Text style={[styles.stepText, styles.stepTextCompleted]}>Details</Text>
         </View>
         <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
               <Text style={[styles.stepNumber, styles.stepNumberActive]}>2</Text>
            </View>
            <Text style={[styles.stepText, styles.stepTextActive]}>Questions</Text>
         </View>
         <View style={styles.stepItem}>
            <View style={styles.stepCircle}>
               <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepText}>Review</Text>
         </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
         
          <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.contentCard}>
            
            {/* Header Row */}
            <View style={styles.cardHeader}>
               <View>
                  <Text style={styles.cardTitle}>Quiz Questions</Text>
                  <Text style={styles.cardSubtitle}>Upload questions via JSON or Excel</Text>
               </View>
               <View style={styles.questionCountBox}>
                  <Text style={styles.questionCountText}>Question Bank ({questions.length} questions)</Text>
               </View>
            </View>

            {/* Input Method Toggle */}
            <View style={styles.methodToggleRow}>
               <Text style={styles.methodLabel}>Input Method:</Text>
               <View style={styles.segmentedControl}>
                  <TouchableOpacity 
                    style={[styles.segmentBtn, inputMethod === 'JSON' && styles.segmentBtnActive]}
                    onPress={() => setInputMethod('JSON')}
                  >
                     <Text style={[styles.segmentBtnText, inputMethod === 'JSON' && styles.segmentBtnTextActive]}>JSON Input</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.segmentBtn, inputMethod === 'Excel' && styles.segmentBtnActive]}
                    onPress={() => setInputMethod('Excel')}
                  >
                     <Text style={[styles.segmentBtnText, inputMethod === 'Excel' && styles.segmentBtnTextActive]}>Excel Upload</Text>
                  </TouchableOpacity>
               </View>
            </View>

            {inputMethod === 'JSON' ? (
              <>
                {/* Paste JSON Questions */}
                <View style={styles.uploadBox}>
                   <Text style={styles.uploadBoxTitle}>Paste JSON Questions</Text>
                   <Text style={styles.formatText}>Format: [{"{\"question\": \"...\", \"options\": [\"A\", \"B\", \"C\", \"D\"], \"answer\": \"B\"}"}]</Text>
                   <TextInput
                      style={styles.jsonInputLarge}
                      multiline
                      numberOfLines={10}
                      textAlignVertical="top"
                      placeholder={'[\n  {\n    "question": "What is 2 + 2?",\n    "options": ["3", "4", "5", "6"],\n    "answer": "4"\n  }\n]'}
                      placeholderTextColor="#9CA3AF"
                      value={jsonText}
                      onChangeText={setJsonText}
                   />
                </View>

                {/* Upload JSON File */}
                <View style={[styles.uploadBox, { marginTop: 16 }]}>
                   <Text style={styles.uploadBoxTitle}>Upload JSON File</Text>
                   <Text style={styles.uploadSubText}>Upload a .json file (max 2MB)</Text>
                   <View style={styles.filePickerRow}>
                      <TouchableOpacity
                        style={[styles.fileBtn, !pickerAvailable && styles.fileBtnDisabled]}
                        onPress={pickerAvailable ? pickJsonFile : undefined}
                        disabled={!pickerAvailable}
                      >
                         <Text style={styles.fileBtnText}>Choose File</Text>
                      </TouchableOpacity>
                      <Text style={styles.fileName}>
                        {selectedJsonFile ? selectedJsonFile.name : 'No file chosen'}
                      </Text>
                   </View>
                   {!pickerAvailable && (
                     <Text style={styles.pickerWarningText}>
                       File picker is unavailable in this app build. Please use JSON text input instead.
                     </Text>
                   )}
                </View>

                <View style={styles.importInfoBar}>
                  <Text style={styles.importLimitText}>Max 50 questions per import</Text>
                  <TouchableOpacity 
                    style={[styles.importBtn, { backgroundColor: '#C084FC' }]}
                    onPress={handleImportJSON}
                    disabled={isImporting}
                  >
                    <Text style={styles.importBtnText}>
                      {isImporting ? 'Importing...' : 'Import Questions'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.tipBox}>
                   <Ionicons name="information-circle-outline" size={16} color="#B45309" style={{ marginRight: 8 }} />
                   <View style={{ flex: 1 }}>
                     <Text style={styles.tipText}>
                       <Text style={{ fontWeight: 'bold' }}>JSON Format Note:</Text> Use the structure below for successful import:
                     </Text>
                     <View style={styles.codeBlock}>
                       <Text style={styles.codeText}>
                         {`[\n  {\n    "text": "What is 2+2?",\n    "options": [\n      {"letter": "A", "value": "4"},\n      {"letter": "B", "value": "5"}\n    ],\n    "correctAnswer": "A"\n  }\n]`}
                       </Text>
                     </View>
                   </View>
                </View>
              </>
            ) : (
              <>
                {/* Upload Excel File */}
                <View style={styles.uploadBox}>
                   <Text style={styles.uploadBoxTitle}>Upload Excel File</Text>
                   <View style={styles.requiredRow}>
                      <Text style={styles.requiredLabel}>Required columns:</Text>
                      <View style={styles.badgeRow}>
                         <View style={styles.badge}><Text style={styles.badgeText}>question</Text></View>
                         <View style={styles.badge}><Text style={styles.badgeText}>option_1</Text></View>
                         <View style={styles.badge}><Text style={styles.badgeText}>option_2</Text></View>
                         <View style={styles.badge}><Text style={styles.badgeText}>correct_option (1-4)</Text></View>
                      </View>
                   </View>
                   
                   <View style={styles.filePickerRow}>
                      <TouchableOpacity
                        style={[styles.fileBtn, !pickerAvailable && styles.fileBtnDisabled]}
                        onPress={pickerAvailable ? pickExcelFile : undefined}
                        disabled={!pickerAvailable}
                      >
                         <Text style={styles.fileBtnText}>Choose File</Text>
                      </TouchableOpacity>
                      <Text style={styles.fileName}>
                        {selectedExcelFile ? selectedExcelFile.name : 'No file chosen'}
                      </Text>
                   </View>
                   {!pickerAvailable && (
                     <Text style={styles.pickerWarningText}>
                       File picker is unavailable in this app build. Rebuild app with the native document picker or use JSON input.
                     </Text>
                   )}
                </View>

                <View style={styles.importInfoBar}>
                  <Text style={styles.importLimitText}>Max 50 rows per upload</Text>
                  <TouchableOpacity 
                    style={[styles.importBtn, { backgroundColor: '#C084FC' }]}
                    onPress={handleImportExcel}
                    disabled={isImporting}
                  >
                    <Text style={styles.importBtnText}>
                      {isImporting ? 'Importing...' : 'Import Questions'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.warningBox}>
                   <Text style={styles.warningText}>
                     <Text style={styles.warningHighlight}>Format:</Text> First row = headers. Each row = one question. correct_option is 1-based (1, 2, 3, or 4).
                   </Text>
                </View>
              </>
            )}

          </Animated.View>

          {/* Existing Questions Preview Section (Moved or hidden if needed) */}
          {questions.length > 0 && (
            <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.previewSection}>
              <View style={styles.headerRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Question Preview</Text>
                    <Text style={styles.sectionSubtitle}>Manage manually added or imported questions</Text>
                  </View>
                  <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => navigation.navigate('TeacherAddQuestion', { quizData } as any)}>
                    <Text style={styles.addBtnText}>+ Add Question</Text>
                  </TouchableOpacity>
              </View>

            {/* Questions List */}
            {questions.map((q, qIndex) => (
               <View key={qIndex} style={styles.questionBlock}>
                  <View style={styles.questionBlockHeader}>
                    <Text style={styles.questionNumLabel}>Question # {qIndex + 1}</Text>
                    <View style={styles.questionActions}>
                      <TouchableOpacity 
                        style={styles.qActionBtn} 
                        onPress={() => navigation.navigate('TeacherAddQuestion', { quizData, editQuestion: q, editIndex: qIndex } as any)}
                      >
                        <Ionicons name="create-outline" size={16} color="#4F46E5" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.qActionBtn, { marginLeft: 8 }]} 
                        onPress={() => {
                          Alert.alert('Delete', 'Remove this question?', [
                            { text: 'No' },
                            { text: 'Yes', onPress: () => setQuestions(prev => prev.filter((_, i) => i !== qIndex)) }
                          ]);
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color="#F43F5E" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <Text style={styles.questionText}>{q.text}</Text>

                  {/* Options */}
                  <View style={styles.optionsContainer}>
                     {(q.options || []).map((opt: any, optIndex: number) => {
                        const isCorrect = opt.letter === q.correctAnswer;
                        return (
                           <View key={optIndex} style={[styles.optionRow, isCorrect ? styles.optionRowCorrect : null]}>
                              <View style={[styles.optionLetterCircle, isCorrect ? styles.optionLetterCircleCorrect : null]}>
                                 <Text style={[styles.optionLetter, isCorrect ? styles.optionLetterCorrect : null]}>{opt.letter}</Text>
                              </View>
                              <Text style={styles.optionValue}>{opt.value}</Text>
                           </View>
                        );
                     })}
                  </View>

                  {/* Correct Answer Note */}
                  <Text style={styles.correctNote}>Correct Answer : {q.correctAnswer}</Text>
               </View>
            ))}

            {questions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="documents-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No questions added yet</Text>
                <Text style={styles.emptySubtext}>Click the button above to add your first question</Text>
              </View>
            )}

          </Animated.View>
          )}

      </ScrollView>

      {/* Bottom Fixed Action Bar */}
      <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.bottomBar}>
         <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={16} color="#111827" style={{marginRight: 6}} />
            <Text style={styles.cancelBtnText}>Previous</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.nextBtn} activeOpacity={0.8} onPress={handleNext}>
            <Text style={styles.nextBtnText}>Next Step</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{marginLeft: 6}} />
         </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 110 },

  globalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10
  },
  menuHandle: { paddingRight: 10, paddingVertical: 10, width: 28 },
  headerTitle: { fontSize: 16,
    fontWeight: '500',
    color: '#4F46E5', 
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#A855F7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  blueHeader: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  blueTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  blueSubtitle: {
    fontSize: 11,
    fontWeight: '400',
    color: '#E0E7FF',
  },

  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingVertical: 20,
    backgroundColor: '#F8FAFC',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  stepCircleCompleted: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  stepNumber: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  stepTextActive: {
    color: '#4F46E5',
  },
  stepTextCompleted: {
    color: '#22C55E',
  },

  contentWrapper: {
    paddingHorizontal: 16,
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  questionCountBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  questionCountText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  methodToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  methodLabel: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
    marginRight: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 4,
    flex: 1,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentBtnActive: {
    backgroundColor: '#8B5CF6',
  },
  segmentBtnText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: '#FFFFFF',
  },
  uploadBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  uploadBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  formatText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  jsonInputLarge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 12,
    color: '#1E293B',
    height: 180,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  uploadSubText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 12,
  },
  filePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FDF4FF',
    borderWidth: 1,
    borderColor: '#F0ABFC',
    borderRadius: 8,
  },
  fileBtnDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  fileBtnText: {
    fontSize: 12,
    color: '#C026D3',
    fontWeight: '700',
  },
  fileName: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 12,
  },
  pickerWarningText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 8,
    marginLeft: 6,
  },
  importInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 20,
  },
  importLimitText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  importBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  importBtnText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tipBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 12,
    flexDirection: 'row',
  },
  tipText: { fontSize: 11, color: '#B45309', lineHeight: 16 },
  codeBlock: {
    marginTop: 8,
    backgroundColor: '#FDF2F2',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 10,
    color: '#991B1B',
  },
  requiredRow: {
    marginBottom: 16,
  },
  requiredLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    color: '#475569',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  warningBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    padding: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  warningHighlight: {
    fontWeight: '800',
  },
  previewSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  addBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 6,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  questionBlock: {
    marginBottom: 32,
  },
  questionBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionActions: {
    flexDirection: 'row',
  },
  qActionBtn: {
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  questionNumLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  questionText: {
    fontSize: 12,
    color: '#111827',
    marginBottom: 20,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  optionRowCorrect: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  optionLetterCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterCircleCorrect: {
    backgroundColor: '#10B981',
  },
  optionLetter: {
    fontSize: 11,
    fontWeight: '800',
    color: '#111827',
  },
  optionLetterCorrect: {
    color: '#FFFFFF',
  },
  optionValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  correctNote: {
    fontSize: 15,
    fontWeight: '600',
    color: '#10B981',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#F8FAFC',
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginRight: 12,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,},
  nextBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default TeacherCreateQuizStep2Screen;
