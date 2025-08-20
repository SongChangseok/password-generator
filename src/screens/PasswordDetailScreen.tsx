import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Share,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { Colors } from '@/utils/colors';
import { SavedPassword } from '@/utils/types';
import { passwordStorage, markPasswordAsUsed } from '@/utils/passwordStorage';
import { PasswordStrengthBar } from '@/components/PasswordStrengthBar';

type RootStackParamList = {
  PasswordDetail: { passwordId: string };
};

type PasswordDetailRouteProp = RouteProp<RootStackParamList, 'PasswordDetail'>;

export default function PasswordDetailScreen() {
  const route = useRoute<PasswordDetailRouteProp>();
  const navigation = useNavigation();
  const { passwordId } = route.params;

  const [password, setPassword] = useState<SavedPassword | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    loadPassword();
  }, [passwordId]);

  const loadPassword = async () => {
    try {
      setLoading(true);
      const passwordData = await passwordStorage.getById(passwordId);

      if (!passwordData) {
        Alert.alert('Error', 'Password not found', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }

      setPassword(passwordData);
    } catch (error) {
      console.error('Error loading password:', error);
      Alert.alert('Error', 'Failed to load password details');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!password || copying) return;

    setCopying(true);
    try {
      await Clipboard.setStringAsync(password.password);

      // Haptic feedback
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Mark password as used
      await markPasswordAsUsed(password.id);

      // Update local state
      setPassword({
        ...password,
        usageCount: password.usageCount + 1,
        lastUsed: new Date(),
      });

      Alert.alert('Success', 'Password copied to clipboard');
    } catch (error) {
      console.error('Error copying password:', error);
      Alert.alert('Error', 'Failed to copy password');
    } finally {
      setCopying(false);
    }
  };

  const handleSharePassword = async () => {
    if (!password) return;

    Alert.alert(
      'Share Password',
      'Are you sure you want to share this password? This will expose it to other apps and people.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share',
          style: 'destructive',
          onPress: async () => {
            try {
              if (
                Platform.OS === 'web' ||
                !(await Sharing.isAvailableAsync())
              ) {
                // Fallback to system share
                await Share.share({
                  message: password.password,
                  title: `Password for ${password.siteName}`,
                });
              } else {
                // Use Expo sharing
                await Sharing.shareAsync(
                  'data:text/plain,' + password.password,
                  {
                    dialogTitle: `Share password for ${password.siteName}`,
                  }
                );
              }
            } catch (error) {
              console.error('Error sharing password:', error);
              Alert.alert('Error', 'Failed to share password');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    (navigation as any).navigate('EditPassword', { passwordId });
  };

  const handleDelete = () => {
    if (!password) return;

    Alert.alert(
      'Delete Password',
      `Are you sure you want to delete the password for "${password.siteName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await passwordStorage.delete(password.id);
              Alert.alert('Success', 'Password deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error deleting password:', error);
              Alert.alert('Error', 'Failed to delete password');
            }
          },
        },
      ]
    );
  };

  const getStrengthColor = (score: number): string => {
    switch (score) {
      case 0:
        return Colors.danger;
      case 1:
        return Colors.warning;
      case 2:
        return '#FFA500';
      case 3:
        return Colors.success;
      case 4:
        return Colors.success;
      default:
        return Colors.gray;
    }
  };

  const getStrengthLabel = (label: string): string => {
    const labels: Record<string, string> = {
      'very-weak': 'Very Weak',
      weak: 'Weak',
      fair: 'Fair',
      good: 'Good',
      strong: 'Strong',
    };
    return labels[label] || label;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPasswordDisplay = (
    pwd: string,
    readable: boolean = false
  ): string => {
    if (!readable) return pwd;

    // Format password in readable 4-character groups
    return pwd.match(/.{1,4}/g)?.join(' ') || pwd;
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Password Details</Text>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Ionicons name="pencil-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Site Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Site Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Site Name</Text>
              <Text style={styles.infoValue}>{password.siteName}</Text>
            </View>

            {password.accountName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Account</Text>
                <Text style={styles.infoValue}>{password.accountName}</Text>
              </View>
            )}

            {password.memo && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={[styles.infoValue, styles.memoText]}>
                  {password.memo}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Password Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Password</Text>

          <View style={styles.passwordCard}>
            <View style={styles.passwordHeader}>
              <Text style={styles.passwordLabel}>Generated Password</Text>
              <View style={styles.passwordActions}>
                <TouchableOpacity
                  style={styles.passwordAction}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.gray600}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.passwordAction}
                  onPress={handleCopyPassword}
                  disabled={copying}
                >
                  <Ionicons
                    name={copying ? 'hourglass-outline' : 'copy-outline'}
                    size={20}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.passwordAction}
                  onPress={handleSharePassword}
                >
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.passwordDisplay}>
              <Text style={styles.passwordText} selectable>
                {showPassword
                  ? formatPasswordDisplay(password.password, true)
                  : '•'.repeat(password.password.length)}
              </Text>
            </View>

            <View style={styles.passwordInfo}>
              <Text style={styles.passwordLength}>
                {password.password.length} characters
              </Text>
            </View>
          </View>
        </View>

        {/* Password Strength */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Password Strength</Text>

          <View style={styles.strengthCard}>
            <View style={styles.strengthHeader}>
              <Text style={styles.strengthLabel}>
                {getStrengthLabel(password.strength.label)}
              </Text>
              <Text style={styles.strengthScore}>
                {password.strength.score}/4
              </Text>
            </View>

            <PasswordStrengthBar
              strength={password.strength}
              style={styles.strengthBar}
            />

            {password.strength.feedback.length > 0 && (
              <View style={styles.strengthFeedback}>
                {password.strength.feedback.map((feedback, index) => (
                  <Text key={index} style={styles.feedbackText}>
                    • {feedback}
                  </Text>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Usage Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usage Statistics</Text>

          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Created</Text>
              <Text style={styles.statValue}>
                {formatDate(password.createdAt)}
              </Text>
            </View>

            {password.lastUsed && (
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Last Used</Text>
                <Text style={styles.statValue}>
                  {formatDate(password.lastUsed)}
                </Text>
              </View>
            )}

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Usage Count</Text>
              <Text style={styles.statValue}>
                {password.usageCount} time{password.usageCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.copyButton]}
            onPress={handleCopyPassword}
            disabled={copying}
          >
            <Ionicons
              name={copying ? 'hourglass-outline' : 'copy-outline'}
              size={20}
              color={Colors.white}
            />
            <Text style={styles.actionButtonText}>
              {copying ? 'Copying...' : 'Copy Password'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={handleEdit}
          >
            <Ionicons name="pencil-outline" size={20} color={Colors.primary} />
            <Text style={[styles.actionButtonText, styles.editButtonText]}>
              Edit Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.white} />
            <Text style={styles.actionButtonText}>Delete Password</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray900,
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.gray900,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray600,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: Colors.gray900,
  },
  memoText: {
    lineHeight: 22,
  },
  passwordCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray600,
  },
  passwordActions: {
    flexDirection: 'row',
    gap: 12,
  },
  passwordAction: {
    padding: 4,
  },
  passwordDisplay: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  passwordText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 18,
    color: Colors.gray900,
    textAlign: 'center',
    lineHeight: 28,
  },
  passwordInfo: {
    alignItems: 'center',
  },
  passwordLength: {
    fontSize: 12,
    color: Colors.gray500,
  },
  strengthCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  strengthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
  },
  strengthScore: {
    fontSize: 14,
    color: Colors.gray600,
    fontWeight: '500',
  },
  strengthBar: {
    marginBottom: 12,
  },
  strengthFeedback: {
    gap: 4,
  },
  feedbackText: {
    fontSize: 14,
    color: Colors.gray700,
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.gray600,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray900,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  copyButton: {
    backgroundColor: Colors.primary,
  },
  editButtonStyle: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: Colors.danger,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  editButtonText: {
    color: Colors.primary,
  },
});
