import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/utils/colors';
import { SavedPassword } from '@/utils/types';
import { passwordStorage } from '@/utils/passwordStorage';

type RootStackParamList = {
  EditPassword: { passwordId: string };
};

type EditPasswordRouteProp = RouteProp<RootStackParamList, 'EditPassword'>;

export default function EditPasswordScreen() {
  const route = useRoute<EditPasswordRouteProp>();
  const navigation = useNavigation();
  const { passwordId } = route.params;

  const [password, setPassword] = useState<SavedPassword | null>(null);
  const [siteName, setSiteName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadPassword();
  }, [passwordId]);

  useEffect(() => {
    if (password) {
      const changes = 
        siteName !== password.siteName ||
        accountName !== (password.accountName || '') ||
        memo !== (password.memo || '');
      setHasChanges(changes);
    }
  }, [siteName, accountName, memo, password]);

  const loadPassword = async () => {
    try {
      setLoading(true);
      const passwordData = await passwordStorage.getById(passwordId);
      
      if (!passwordData) {
        Alert.alert('Error', 'Password not found', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        return;
      }

      setPassword(passwordData);
      setSiteName(passwordData.siteName);
      setAccountName(passwordData.accountName || '');
      setMemo(passwordData.memo || '');
    } catch (error) {
      console.error('Error loading password:', error);
      Alert.alert('Error', 'Failed to load password details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!password) return;

    if (!siteName.trim()) {
      Alert.alert('Required Field', 'Site name cannot be empty');
      return;
    }

    if (!hasChanges) {
      navigation.goBack();
      return;
    }

    setSaving(true);

    try {
      await passwordStorage.update(password.id, {
        siteName: siteName.trim(),
        accountName: accountName.trim() || undefined,
        memo: memo.trim() || undefined,
      });

      Alert.alert('Success', 'Password details updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('Error', 'Failed to update password details');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Go Back', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const resetChanges = () => {
    if (!password) return;

    Alert.alert(
      'Reset Changes',
      'Are you sure you want to reset all changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            setSiteName(password.siteName);
            setAccountName(password.accountName || '');
            setMemo(password.memo || '');
          },
        },
      ]
    );
  };

  const getStrengthColor = (score: number): string => {
    switch (score) {
      case 0: return Colors.danger;
      case 1: return Colors.warning;
      case 2: return '#FFA500';
      case 3: return Colors.success;
      case 4: return Colors.success;
      default: return Colors.gray;
    }
  };

  const getStrengthLabel = (label: string): string => {
    const labels: Record<string, string> = {
      'very-weak': 'Very Weak',
      'weak': 'Weak',
      'fair': 'Fair',
      'good': 'Good',
      'strong': 'Strong',
    };
    return labels[label] || label;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading password details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!password) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Password not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Password</Text>
          <TouchableOpacity
            style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
          >
            <Text style={[styles.saveButtonText, (!hasChanges || saving) && styles.saveButtonTextDisabled]}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Password Information (Read-only) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Password Information</Text>
            <Text style={styles.sectionSubtitle}>
              This information cannot be edited for security reasons
            </Text>
            
            <View style={styles.readOnlyCard}>
              <View style={styles.passwordRow}>
                <Text style={styles.passwordLabel}>Password</Text>
                <Text style={styles.passwordValue}>
                  {'•'.repeat(password.password.length)} ({password.password.length} chars)
                </Text>
              </View>
              
              <View style={styles.strengthRow}>
                <Text style={styles.strengthLabel}>Strength</Text>
                <View style={styles.strengthContainer}>
                  <View
                    style={[
                      styles.strengthDot,
                      { backgroundColor: getStrengthColor(password.strength.score) }
                    ]}
                  />
                  <Text style={styles.strengthText}>
                    {getStrengthLabel(password.strength.label)}
                  </Text>
                </View>
              </View>

              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Created</Text>
                <Text style={styles.dateText}>
                  {password.createdAt.toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Editable Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Editable Information</Text>
            
            {/* Site Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Site Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={siteName}
                onChangeText={setSiteName}
                placeholder="Enter site name"
                placeholderTextColor={Colors.gray400}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Account Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Name</Text>
              <TextInput
                style={styles.textInput}
                value={accountName}
                onChangeText={setAccountName}
                placeholder="Enter account name or email"
                placeholderTextColor={Colors.gray400}
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            {/* Memo */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.textInput, styles.memoInput]}
                value={memo}
                onChangeText={setMemo}
                placeholder="Add notes or reminders"
                placeholderTextColor={Colors.gray400}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Action Buttons */}
          {hasChanges && (
            <View style={styles.actionSection}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetChanges}
              >
                <Ionicons name="refresh-outline" size={20} color={Colors.gray600} />
                <Text style={styles.resetButtonText}>Reset Changes</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Save Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>Edit Instructions</Text>
            <Text style={styles.instructionsText}>
              • Site name is required and helps you identify this password
            </Text>
            <Text style={styles.instructionsText}>
              • Account name is optional (e.g., your email or username)
            </Text>
            <Text style={styles.instructionsText}>
              • Notes can contain any additional information
            </Text>
            <Text style={styles.instructionsText}>
              • The password itself cannot be changed for security reasons
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.gray600,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: Colors.danger,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.gray600,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray900,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  saveButtonTextDisabled: {
    color: Colors.gray500,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 16,
  },
  readOnlyCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray600,
  },
  passwordValue: {
    fontSize: 14,
    color: Colors.gray900,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  strengthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  strengthLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray600,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  strengthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  strengthText: {
    fontSize: 14,
    color: Colors.gray900,
    fontWeight: '500',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray600,
  },
  dateText: {
    fontSize: 14,
    color: Colors.gray900,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray700,
    marginBottom: 8,
  },
  required: {
    color: Colors.danger,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.gray900,
    backgroundColor: Colors.white,
  },
  memoInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  actionSection: {
    marginTop: 32,
    marginBottom: 16,
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: Colors.gray100,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 16,
    color: Colors.gray600,
    fontWeight: '500',
  },
  instructionsSection: {
    marginTop: 32,
    marginBottom: 40,
    padding: 16,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.gray600,
    lineHeight: 20,
    marginBottom: 4,
  },
});