import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { selection } from '../utils/haptics';

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 3;
const REPEAT_COUNT = 5; // Number of times to repeat the list for looping effect

export default function WheelPicker({ value, onChange, maxValue = 60, label }) {
  const { theme } = useTheme();
  const scrollViewRef = useRef(null);
  const lastValue = useRef(value);
  const isAdjusting = useRef(false);

  const itemCount = maxValue + 1;
  // Generate items repeated multiple times for infinite scroll effect
  const items = Array.from({ length: itemCount * REPEAT_COUNT }, (_, i) => i % itemCount);

  // Middle section offset (start in the middle repeat)
  const middleOffset = Math.floor(REPEAT_COUNT / 2) * itemCount;

  const scrollToValue = useCallback(
    (val, animated = false) => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: (middleOffset + val) * ITEM_HEIGHT,
          animated,
        });
      }
    },
    [middleOffset]
  );

  useEffect(() => {
    // Scroll to initial value in the middle section
    scrollToValue(value, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = (event) => {
    if (isAdjusting.current) return;

    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const actualValue = ((index % itemCount) + itemCount) % itemCount;

    // Check if we need to jump back to middle section
    const lowerBound = itemCount;
    const upperBound = itemCount * (REPEAT_COUNT - 1);

    if (index < lowerBound || index >= upperBound) {
      isAdjusting.current = true;
      scrollToValue(actualValue, false);
      setTimeout(() => {
        isAdjusting.current = false;
      }, 50);
    }

    if (actualValue !== lastValue.current) {
      lastValue.current = actualValue;
      selection();
      onChange(actualValue);
    }
  };

  const renderItem = (item, index) => {
    return (
      <View key={index} style={styles.itemContainer}>
        <Text
          style={[
            styles.itemText,
            { color: item === value ? theme.text : theme.textSecondary },
            item === value && styles.selectedText,
          ]}
        >
          {String(item).padStart(2, '0')}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.pickerWrapper}>
        {/* Selection indicator */}
        <View
          style={[
            styles.selectionIndicator,
            { backgroundColor: theme.primary + '20', borderColor: theme.primary + '40' },
          ]}
          pointerEvents="none"
        />

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScroll}
          onScrollEndDrag={handleScroll}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
        >
          {/* Top padding - reduced for 3 visible items (1 item padding) */}
          <View style={{ height: ITEM_HEIGHT }} />

          {items.map(renderItem)}

          {/* Bottom padding */}
          <View style={{ height: ITEM_HEIGHT }} />
        </ScrollView>
      </View>

      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pickerWrapper: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: 70,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 20,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  selectedText: {
    fontSize: 24,
    fontWeight: '700',
  },
  selectionIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT, // Middle of 3 items (index 1)
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
});
