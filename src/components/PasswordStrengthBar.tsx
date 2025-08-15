import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PasswordStrength } from '../utils/types';
import { Colors, getStrengthColor } from '../utils/colors';

interface PasswordStrengthBarProps {
  strength: PasswordStrength;
  style?: any;
}

const getStrengthLabel = (score: number): string => {
  switch (score) {
    case 0:
      return 'Very Weak';
    case 1:
      return 'Weak';
    case 2:
      return 'Fair';
    case 3:
      return 'Good';
    case 4:
      return 'Strong';
    default:
      return 'Unknown';
  }
};

export const PasswordStrengthBar: React.FC<PasswordStrengthBarProps> = ({
  strength,
  style,
}) => {
  const strengthColor = getStrengthColor(strength.score);
  const strengthWidth = Math.max((strength.score / 4) * 100, 10); // Minimum 10% width

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>Password Strength</Text>
        <Text style={[styles.strengthText, { color: strengthColor }]}>
          {getStrengthLabel(strength.score)}
        </Text>
      </View>

      <View style={styles.barContainer}>
        <View
          style={[
            styles.strengthBar,
            {
              width: `${strengthWidth}%`,
              backgroundColor: strengthColor,
            },
          ]}
        />
      </View>

      {strength.feedback.length > 0 && (
        <View style={styles.feedbackContainer}>
          {strength.feedback.map((feedback, index) => (
            <Text key={index} style={styles.feedbackText}>
              • {feedback}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '600',
  },
  barContainer: {
    height: 6,
    backgroundColor: Colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthBar: {
    height: '100%',
    borderRadius: 3,
  },
  feedbackContainer: {
    marginTop: 8,
  },
  feedbackText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
});
