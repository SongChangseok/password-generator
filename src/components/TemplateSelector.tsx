import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/utils/colors';
import { GeneratorOptions, TemplateConfig } from '@/utils/types';
import { 
  PASSWORD_TEMPLATES, 
  detectCurrentTemplate, 
  getTemplateStats 
} from '@/utils/passwordTemplates';

interface TemplateSelectorProps {
  currentOptions: GeneratorOptions;
  onTemplateSelect: (options: GeneratorOptions) => void;
  style?: any;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  currentOptions,
  onTemplateSelect,
  style,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const currentTemplate = detectCurrentTemplate(currentOptions);

  const handleTemplateSelect = (template: TemplateConfig) => {
    Alert.alert(
      'Apply Template',
      `Apply "${template.name}" template? This will override your current settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            onTemplateSelect(template.options);
            setModalVisible(false);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.selectorContent}>
          <View style={styles.selectorLeft}>
            <Ionicons name="bookmark-outline" size={20} color={Colors.primary} />
            <Text style={styles.selectorLabel}>Template</Text>
          </View>
          <View style={styles.selectorRight}>
            <Text style={styles.currentTemplate}>
              {currentTemplate ? currentTemplate.name : 'Custom'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray400} />
          </View>
        </View>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Password Templates</Text>
            <View style={styles.closeButton} />
          </View>

          {/* Template List */}
          <ScrollView style={styles.templateList}>
            <Text style={styles.sectionDescription}>
              Choose a preset template to quickly configure password generation options
            </Text>

            {PASSWORD_TEMPLATES.map((template, index) => {
              const stats = getTemplateStats(template);
              const isSelected = currentTemplate?.name === template.name;

              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.templateCard, isSelected && styles.selectedCard]}
                  onPress={() => handleTemplateSelect(template)}
                >
                  <View style={styles.templateHeader}>
                    <Text style={[styles.templateName, isSelected && styles.selectedText]}>
                      {template.name}
                    </Text>
                    <View style={styles.securityBadge}>
                      <Text style={styles.securityLevel}>{stats.securityLevel}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                    )}
                  </View>
                  
                  <Text style={styles.templateDescription}>
                    {template.description}
                  </Text>
                  
                  <View style={styles.templateStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Length</Text>
                      <Text style={styles.statValue}>{template.options.length}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Entropy</Text>
                      <Text style={styles.statValue}>{stats.entropy} bits</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Crack Time</Text>
                      <Text style={styles.statValue}>{stats.estimatedCrackTime}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.templateOptions}>
                    {template.options.includeUppercase && (
                      <View style={styles.optionChip}>
                        <Text style={styles.optionText}>ABC</Text>
                      </View>
                    )}
                    {template.options.includeLowercase && (
                      <View style={styles.optionChip}>
                        <Text style={styles.optionText}>abc</Text>
                      </View>
                    )}
                    {template.options.includeNumbers && (
                      <View style={styles.optionChip}>
                        <Text style={styles.optionText}>123</Text>
                      </View>
                    )}
                    {template.options.includeSymbols && (
                      <View style={styles.optionChip}>
                        <Text style={styles.optionText}>!@#</Text>
                      </View>
                    )}
                    {template.options.excludeSimilar && (
                      <View style={[styles.optionChip, styles.specialChip]}>
                        <Text style={styles.optionText}>No Similar</Text>
                      </View>
                    )}
                    {template.options.preventRepeating && (
                      <View style={[styles.optionChip, styles.specialChip]}>
                        <Text style={styles.optionText}>No Repeat</Text>
                      </View>
                    )}
                    {template.options.readableFormat && (
                      <View style={[styles.optionChip, styles.specialChip]}>
                        <Text style={styles.optionText}>Readable</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selectorButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.gray200,
    padding: 16,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.gray900,
  },
  selectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentTemplate: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
    paddingTop: 60, // Account for status bar
  },
  closeButton: {
    minWidth: 60,
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.primary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray900,
  },
  templateList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionDescription: {
    fontSize: 14,
    color: Colors.gray600,
    marginVertical: 16,
    textAlign: 'center',
  },
  templateCard: {
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    backgroundColor: Colors.primaryLight + '10',
    borderColor: Colors.primary,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray900,
    flex: 1,
  },
  selectedText: {
    color: Colors.primary,
  },
  securityBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  securityLevel: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
  },
  templateDescription: {
    fontSize: 14,
    color: Colors.gray600,
    marginBottom: 12,
    lineHeight: 20,
  },
  templateStats: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.gray500,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray900,
  },
  templateOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionChip: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  specialChip: {
    backgroundColor: Colors.gray600,
  },
  optionText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '500',
  },
});