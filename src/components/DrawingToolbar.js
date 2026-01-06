import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { selection, tapLight, tapMedium } from '../utils/haptics';

// Color palette - 12 colors
const COLORS = [
  { id: 'black', color: '#000000', label: 'Black' },
  { id: 'red', color: '#EF4444', label: 'Red' },
  { id: 'blue', color: '#3B82F6', label: 'Blue' },
  { id: 'green', color: '#22C55E', label: 'Green' },
  { id: 'orange', color: '#F97316', label: 'Orange' },
  { id: 'yellow', color: '#EAB308', label: 'Yellow' },
  { id: 'purple', color: '#8B5CF6', label: 'Purple' },
  { id: 'pink', color: '#EC4899', label: 'Pink' },
  { id: 'teal', color: '#14B8A6', label: 'Teal' },
  { id: 'brown', color: '#92400E', label: 'Brown' },
  { id: 'gray', color: '#6B7280', label: 'Gray' },
  { id: 'white', color: '#FFFFFF', label: 'White' },
];

// First 3 colors shown in toolbar
const QUICK_COLORS = COLORS.slice(0, 3);

const ERASER_COLOR = '#FFFFFF';

export default function DrawingToolbar({
  selectedColor,
  onColorChange,
  isEraser,
  onEraserToggle,
  onPenSelect,
  onUndo,
  disabled = false,
}) {
  const { theme } = useTheme();
  const [colorPickerVisible, setColorPickerVisible] = useState(false);

  const handleColorPress = (color) => {
    selection();
    onColorChange(color);
    setColorPickerVisible(false);
  };

  const handlePenPress = () => {
    if (disabled) return;
    tapLight();
    onPenSelect();
  };

  const handleEraserPress = () => {
    if (disabled) return;
    tapLight();
    onEraserToggle();
  };

  const handleUndo = () => {
    if (disabled) return;
    tapMedium();
    onUndo();
  };

  const isQuickColor = QUICK_COLORS.some((c) => c.color === selectedColor);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
    >
      {/* Left side: Colors */}
      <View style={styles.leftSection}>
        {/* Quick Colors (first 3) */}
        {QUICK_COLORS.map((colorItem) => (
          <TouchableOpacity
            key={colorItem.id}
            style={[
              styles.quickColorButton,
              { backgroundColor: colorItem.color },
              colorItem.color === '#FFFFFF' && styles.whiteBorder,
              selectedColor === colorItem.color && !isEraser && styles.colorSelected,
              disabled && styles.disabled,
            ]}
            onPress={() => handleColorPress(colorItem.color)}
            disabled={disabled}
            activeOpacity={0.7}
          />
        ))}

        {/* More Colors Button */}
        <TouchableOpacity
          style={[
            styles.moreColorsButton,
            { borderColor: theme.border },
            !isQuickColor && !isEraser && { borderColor: theme.primary, borderWidth: 2 },
            disabled && styles.disabled,
          ]}
          onPress={() => !disabled && setColorPickerVisible(true)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          {!isQuickColor && !isEraser ? (
            <View style={[styles.selectedColorDot, { backgroundColor: selectedColor }]} />
          ) : (
            <Text style={[styles.moreColorsText, { color: theme.textSecondary }]}>+</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Right side: Tools */}
      <View style={styles.rightSection}>
        {/* Pen Tool */}
        <TouchableOpacity
          style={[
            styles.toolButton,
            !isEraser && styles.toolButtonActive,
            !isEraser && { backgroundColor: theme.primary },
            disabled && styles.disabled,
          ]}
          onPress={handlePenPress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.toolIcon}>✏️</Text>
        </TouchableOpacity>

        {/* Eraser Tool */}
        <TouchableOpacity
          style={[
            styles.toolButton,
            isEraser && styles.toolButtonActive,
            isEraser && { backgroundColor: theme.warning },
            disabled && styles.disabled,
          ]}
          onPress={handleEraserPress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.toolIcon}>🧽</Text>
        </TouchableOpacity>

        {/* Undo Button */}
        <TouchableOpacity
          style={[styles.toolButton, styles.undoButton, disabled && styles.disabled]}
          onPress={handleUndo}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.undoIcon}>↩</Text>
        </TouchableOpacity>
      </View>

      {/* Color Picker Modal */}
      <Modal
        visible={colorPickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setColorPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setColorPickerVisible(false)}
        >
          <View style={[styles.colorPickerContainer, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.colorPickerTitle, { color: theme.text }]}>Select Color</Text>
            <View style={styles.colorGrid}>
              {COLORS.map((colorItem) => (
                <TouchableOpacity
                  key={colorItem.id}
                  style={[
                    styles.colorGridItem,
                    { backgroundColor: colorItem.color },
                    colorItem.color === '#FFFFFF' && styles.whiteBorder,
                    selectedColor === colorItem.color && styles.colorGridSelected,
                  ]}
                  onPress={() => handleColorPress(colorItem.color)}
                  activeOpacity={0.7}
                >
                  {selectedColor === colorItem.color && (
                    <Text
                      style={[
                        styles.checkmark,
                        colorItem.color === '#000000' && { color: '#fff' },
                        colorItem.color === '#FFFFFF' && { color: '#000' },
                      ]}
                    >
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.border }]}
              onPress={() => setColorPickerVisible(false)}
            >
              <Text style={[styles.closeButtonText, { color: theme.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export { COLORS, ERASER_COLOR };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickColorButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  colorSelected: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    transform: [{ scale: 1.1 }],
  },
  moreColorsButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreColorsText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectedColorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  whiteBorder: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  toolButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  toolIcon: {
    fontSize: 18,
  },
  disabled: {
    opacity: 0.5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerContainer: {
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  colorGridItem: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  colorGridSelected: {
    borderWidth: 3,
    borderColor: '#3B82F6',
  },
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  undoButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#999',
  },
  undoIcon: {
    fontSize: 26,
    color: '#555',
  },
});
