import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import SignatureCanvas from 'react-native-signature-canvas';

export default function DrawingCanvas({ onSave, onClear }) {
  const ref = useRef();

  const handleSignature = (signature) => {
    // signature is base64 string
    onSave(signature);
  };

  const handleClear = () => {
    ref.current?.clearSignature();
    if (onClear) onClear();
  };

  const handleEnd = () => {
    ref.current?.readSignature();
  };

  return (
    <View style={styles.container}>
      <SignatureCanvas
        ref={ref}
        onEnd={handleEnd}
        onOK={handleSignature}
        descriptionText="Draw here"
        clearText="Clear"
        confirmText="Done"
        webStyle={`.m-signature-pad {
          box-shadow: none;
          border: none;
        }
        .m-signature-pad--body {
          border: none;
        }
        .m-signature-pad--footer {
          display: none;
        }
        body,html {
          width: 100%;
          height: 100%;
        }`}
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.buttonText}>🗑️ Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
