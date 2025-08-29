import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  generateSecurePassword,
  DEFAULT_OPTIONS,
} from '../utils/passwordGenerator';
import { GeneratorOptions, GeneratedPassword } from '../utils/types';
import { Colors } from '../utils/colors';
import { PasswordDisplay } from '../components/PasswordDisplay';
import { PasswordStrengthBar } from '../components/PasswordStrengthBar';
import { LengthSlider } from '../components/LengthSlider';
import { CharacterTypeOptions } from '../components/CharacterTypeOptions';
import { GenerateButton } from '../components/GenerateButton';
import { TemplateSelector } from '../components/TemplateSelector';
import { BannerAdComponent } from '../components/BannerAdComponent';
import { SavePasswordDialog } from '../components/SavePasswordDialog';
import { trackPasswordGenerated } from '../utils/analytics';
import { SavePasswordOptions } from '../utils/types';

export default function GeneratorScreen() {
  const [options, setOptions] = useState<GeneratorOptions>(DEFAULT_OPTIONS);
  const [generatedPassword, setGeneratedPassword] =
    useState<GeneratedPassword | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleGeneratePassword = useCallback(async () => {
    try {
      setLoading(true);

      // Validate that at least one character type is selected
      if (
        !options.includeUppercase &&
        !options.includeLowercase &&
        !options.includeNumbers &&
        !options.includeSymbols
      ) {
        Alert.alert(
          'Invalid Options',
          'Please select at least one character type.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await generateSecurePassword(options);
      setGeneratedPassword(result);

      // Track password generation
      trackPasswordGenerated({
        length: options.length,
        hasUppercase: options.includeUppercase,
        hasLowercase: options.includeLowercase,
        hasNumbers: options.includeNumbers,
        hasSymbols: options.includeSymbols,
        excludeSimilar: options.excludeSimilar,
        preventRepeating: options.preventRepeating,
        strengthScore: result.strength.score,
      });
    } catch (error) {
      console.error('Error generating password:', error);
      Alert.alert('Error', 'Failed to generate password. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [options]);

  const handleLengthChange = (length: number) => {
    setOptions((prev) => ({ ...prev, length }));
  };

  const handleOptionsChange = (newOptions: GeneratorOptions) => {
    setOptions(newOptions);
  };

  const handleCopyPassword = () => {
    // Optional callback when password is copied
    console.log('Password copied to clipboard');
  };

  const handleSavePassword = () => {
    if (!generatedPassword) return;
    setShowSaveDialog(true);
  };

  const handleSaveComplete = () => {
    setShowSaveDialog(false);
    Alert.alert('Success', 'Password saved successfully!', [{ text: 'OK' }]);
  };

  // Generate initial password when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (!generatedPassword) {
        handleGeneratePassword();
      }
    }, [generatedPassword, handleGeneratePassword])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainContent}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <PasswordDisplay
            password={generatedPassword?.password || ''}
            readableFormat={options.readableFormat}
            onCopy={handleCopyPassword}
            style={styles.section}
          />

          {generatedPassword && (
            <PasswordStrengthBar
              strength={generatedPassword.strength}
              style={styles.section}
            />
          )}

          <TemplateSelector
            currentOptions={options}
            onTemplateSelect={handleOptionsChange}
            style={styles.section}
          />

          <LengthSlider
            value={options.length}
            onValueChange={handleLengthChange}
            style={styles.section}
          />

          <CharacterTypeOptions
            options={options}
            onOptionsChange={handleOptionsChange}
            style={styles.section}
          />

          <GenerateButton
            onPress={handleGeneratePassword}
            loading={loading}
            title={
              generatedPassword ? 'Regenerate Password' : 'Generate Password'
            }
            style={styles.generateButton}
          />

          {generatedPassword && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSavePassword}
            >
              <Text style={styles.saveButtonText}>Save Password</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <BannerAdComponent hideWhenGenerating={true} isGenerating={loading} />
      </View>

      {/* Save Password Dialog */}
      <SavePasswordDialog
        visible={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveComplete}
        passwordData={
          generatedPassword
            ? {
                password: generatedPassword.password,
                strength: generatedPassword.strength,
                options: options,
              }
            : (undefined as any)
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mainContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 8,
  },
  generateButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: Colors.success,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
