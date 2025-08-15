import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Colors } from '../utils/colors';

interface LengthSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  style?: any;
}

export const LengthSlider: React.FC<LengthSliderProps> = ({
  value,
  onValueChange,
  minimumValue = 8,
  maximumValue = 32,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.label}>Password Length</Text>
        <View style={styles.valueContainer}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.unit}>characters</Text>
        </View>
      </View>

      <View style={styles.sliderContainer}>
        <Text style={styles.minMax}>{minimumValue}</Text>
        <Slider
          style={styles.slider}
          value={value}
          onValueChange={onValueChange}
          minimumValue={minimumValue}
          maximumValue={maximumValue}
          step={1}
          minimumTrackTintColor={Colors.primary}
          maximumTrackTintColor={Colors.gray300}
        />
        <Text style={styles.minMax}>{maximumValue}</Text>
      </View>
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
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  unit: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 12,
  },
  minMax: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    minWidth: 20,
    textAlign: 'center',
  },
});
