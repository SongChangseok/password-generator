import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GeneratorOptions } from '../utils/types';
import { Colors } from '../utils/colors';

interface CharacterTypeOptionsProps {
  options: GeneratorOptions;
  onOptionsChange: (options: GeneratorOptions) => void;
  style?: any;
}

interface OptionItem {
  key: keyof GeneratorOptions;
  label: string;
  description: string;
}

const characterOptions: OptionItem[] = [
  {
    key: 'includeUppercase',
    label: 'Uppercase Letters',
    description: 'A, B, C, D...',
  },
  {
    key: 'includeLowercase',
    label: 'Lowercase Letters',
    description: 'a, b, c, d...',
  },
  {
    key: 'includeNumbers',
    label: 'Numbers',
    description: '0, 1, 2, 3...',
  },
  {
    key: 'includeSymbols',
    label: 'Symbols',
    description: '!, @, #, $...',
  },
];

const advancedOptions: OptionItem[] = [
  {
    key: 'excludeSimilar',
    label: 'Exclude Similar Characters',
    description: 'Avoid I, l, 1, 0, O, |',
  },
  {
    key: 'preventRepeating',
    label: 'Prevent Repeating Characters',
    description: 'No consecutive identical characters',
  },
];

export const CharacterTypeOptions: React.FC<CharacterTypeOptionsProps> = ({
  options,
  onOptionsChange,
  style,
}) => {
  const toggleOption = (key: keyof GeneratorOptions) => {
    onOptionsChange({
      ...options,
      [key]: !options[key],
    });
  };

  const renderOptionItem = (item: OptionItem) => {
    const isEnabled = Boolean(options[item.key]);

    return (
      <TouchableOpacity
        key={item.key}
        style={[styles.optionItem, isEnabled && styles.optionItemActive]}
        onPress={() => toggleOption(item.key)}
        activeOpacity={0.7}
      >
        <View style={styles.optionContent}>
          <View style={styles.optionHeader}>
            <Text
              style={[
                styles.optionLabel,
                isEnabled && styles.optionLabelActive,
              ]}
            >
              {item.label}
            </Text>
            <View style={[styles.checkbox, isEnabled && styles.checkboxActive]}>
              {isEnabled && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>
          <Text
            style={[
              styles.optionDescription,
              isEnabled && styles.optionDescriptionActive,
            ]}
          >
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.sectionTitle}>Character Types</Text>
      <View style={styles.optionsGrid}>
        {characterOptions.map(renderOptionItem)}
      </View>

      <Text style={styles.sectionTitle}>Advanced Options</Text>
      <View style={styles.optionsGrid}>
        {advancedOptions.map(renderOptionItem)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  optionsGrid: {
    gap: 12,
  },
  optionItem: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: Colors.shadowLight,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  optionItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08', // 8% opacity
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  optionLabelActive: {
    color: Colors.primary,
  },
  optionDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  optionDescriptionActive: {
    color: Colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
