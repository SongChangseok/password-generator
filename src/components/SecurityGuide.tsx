import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors } from '@/utils/colors';

interface SecurityTip {
  id: string;
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
}

const SECURITY_TIPS: SecurityTip[] = [
  {
    id: 'biometric',
    title: 'Enable Biometric Authentication',
    description:
      'Use Face ID, Touch ID, or fingerprint for quick and secure access.',
    importance: 'high',
  },
  {
    id: 'pin',
    title: 'Set up PIN Code',
    description:
      'Create a backup PIN code in case biometric authentication fails.',
    importance: 'high',
  },
  {
    id: 'autolock',
    title: 'Configure Auto-Lock',
    description:
      'Set automatic locking to protect your passwords when inactive.',
    importance: 'medium',
  },
  {
    id: 'background',
    title: 'Background Protection',
    description: 'Enable screen hiding when the app goes to background.',
    importance: 'medium',
  },
  {
    id: 'strong',
    title: 'Use Strong Passwords',
    description:
      'Generate passwords with at least 12 characters including all character types.',
    importance: 'high',
  },
  {
    id: 'unique',
    title: 'Unique Passwords',
    description: 'Never reuse passwords across different accounts or services.',
    importance: 'high',
  },
];

interface SecurityGuideProps {
  onClose?: () => void;
  compact?: boolean;
}

export const SecurityGuide: React.FC<SecurityGuideProps> = ({
  onClose,
  compact = false,
}) => {
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high':
        return Colors.warning;
      case 'medium':
        return '#F59E0B'; // amber
      case 'low':
        return Colors.gray600;
      default:
        return Colors.gray600;
    }
  };

  const getImportanceLabel = (importance: string) => {
    switch (importance) {
      case 'high':
        return 'Critical';
      case 'medium':
        return 'Important';
      case 'low':
        return 'Recommended';
      default:
        return 'Info';
    }
  };

  const handleLearnMore = () => {
    Alert.alert(
      'Security Best Practices',
      'These recommendations help protect your passwords and personal data. Following all guidelines ensures maximum security for your generated passwords.',
      [{ text: 'OK' }]
    );
  };

  if (compact) {
    const criticalTips = SECURITY_TIPS.filter(
      (tip) => tip.importance === 'high'
    );
    return (
      <View style={styles.compactContainer}>
        <Text style={styles.compactTitle}>Security Recommendations</Text>
        {criticalTips.slice(0, 2).map((tip) => (
          <View key={tip.id} style={styles.compactTip}>
            <View
              style={[
                styles.compactIndicator,
                { backgroundColor: getImportanceColor(tip.importance) },
              ]}
            />
            <Text style={styles.compactTipText}>{tip.title}</Text>
          </View>
        ))}
        <TouchableOpacity
          style={styles.learnMoreButton}
          onPress={handleLearnMore}
        >
          <Text style={styles.learnMoreText}>Learn More</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Security Guide</Text>
        <Text style={styles.subtitle}>
          Follow these recommendations to keep your passwords secure
        </Text>
      </View>

      <View style={styles.tipsContainer}>
        {SECURITY_TIPS.map((tip) => (
          <View key={tip.id} style={styles.tipCard}>
            <View style={styles.tipHeader}>
              <Text style={styles.tipTitle}>{tip.title}</Text>
              <View
                style={[
                  styles.importanceBadge,
                  {
                    backgroundColor: getImportanceColor(tip.importance) + '20',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.importanceText,
                    { color: getImportanceColor(tip.importance) },
                  ]}
                >
                  {getImportanceLabel(tip.importance)}
                </Text>
              </View>
            </View>
            <Text style={styles.tipDescription}>{tip.description}</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.infoButton} onPress={handleLearnMore}>
          <Text style={styles.infoButtonText}>Learn More About Security</Text>
        </TouchableOpacity>

        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close Guide</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gray900,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.gray600,
    lineHeight: 24,
  },
  tipsContainer: {
    padding: 20,
    paddingTop: 10,
  },
  tipCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  tipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray900,
    flex: 1,
  },
  importanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  importanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tipDescription: {
    fontSize: 14,
    color: Colors.gray600,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    paddingTop: 10,
  },
  infoButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  infoButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: Colors.gray200,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: Colors.gray700,
    fontSize: 16,
    fontWeight: '600',
  },
  // Compact styles
  compactContainer: {
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    padding: 16,
    margin: 16,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 12,
  },
  compactTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  compactTipText: {
    fontSize: 14,
    color: Colors.gray700,
    flex: 1,
  },
  learnMoreButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  learnMoreText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});
