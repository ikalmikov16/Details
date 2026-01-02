import { get, off, onValue, ref, update } from 'firebase/database';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DrawingCanvas from '../components/DrawingCanvas';
import { database, storage } from '../config/firebase';
import { useTheme } from '../context/ThemeContext';

export default function MultiplayerDrawingScreen({ route, navigation }) {
  const { roomCode, playerId, playerName } = route.params;
  const { theme } = useTheme();
  const [topic, setTopic] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timeLimit, setTimeLimit] = useState(60);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [drawingData, setDrawingData] = useState(null);

  useEffect(() => {
    const roomRef = ref(database, `rooms/${roomCode}`);
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (!snapshot.exists()) {
        Alert.alert('Error', 'Room not found');
        navigation.replace('Welcome');
        return;
      }

      const roomData = snapshot.val();
      setTopic(roomData.currentTopic || '');
      setTimeLimit(roomData.settings.timeLimit);

      // Calculate time remaining
      if (roomData.drawingStartTime) {
        const elapsed = Math.floor((Date.now() - roomData.drawingStartTime) / 1000);
        const remaining = Math.max(0, roomData.settings.timeLimit - elapsed);
        setTimeRemaining(remaining);
      }

      // Check if moved to rating phase
      if (roomData.status === 'rating') {
        navigation.replace('MultiplayerRating', {
          roomCode,
          playerId,
          playerName,
        });
      }
    });

    return () => {
      off(roomRef);
    };
  }, [roomCode, playerId]);

  useEffect(() => {
    if (timeRemaining === 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleTimeUp = async () => {
    if (!hasSubmitted && drawingData) {
      await handleSubmitDrawing();
    }
  };

  const handleDrawingSave = (signature) => {
    setDrawingData(signature);
  };

  const handleSubmitDrawing = async () => {
    if (!drawingData) {
      Alert.alert('No Drawing', 'Please draw something before submitting!');
      return;
    }

    if (hasSubmitted) {
      Alert.alert('Already Submitted', 'You have already submitted your drawing.');
      return;
    }

    try {
      console.log('Starting drawing upload...');
      console.log('Drawing data type:', typeof drawingData);
      console.log('Drawing data length:', drawingData?.length);
      console.log('Drawing data preview:', drawingData?.substring(0, 100));
      
      // Ensure we have a proper data URL
      let dataUrl = drawingData;
      if (!dataUrl.startsWith('data:')) {
        dataUrl = `data:image/png;base64,${dataUrl}`;
      }
      
      console.log('Converting data URL to blob using fetch...');
      // Use fetch to convert data URL to blob (works in React Native)
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      console.log('Blob created, size:', blob.size, 'type:', blob.type);
      
      // Upload drawing to Firebase Storage
      const drawingRef = storageRef(
        storage,
        `drawings/${roomCode}/${playerId}_round${1}.png`
      );

      console.log('Uploading to path:', `drawings/${roomCode}/${playerId}_round${1}.png`);
      
      // Use uploadBytes with the blob
      await uploadBytes(drawingRef, blob, {
        contentType: 'image/png'
      });
      
      console.log('Getting download URL...');
      const downloadURL = await getDownloadURL(drawingRef);
      
      console.log('Download URL:', downloadURL);
      console.log('Saving to database...');
      
      // Save drawing URL to database
      await update(
        ref(database, `rooms/${roomCode}/drawings/${playerId}`),
        {
          url: downloadURL,
          submittedAt: Date.now(),
        }
      );

      setHasSubmitted(true);
      Alert.alert('Success!', 'Your drawing has been submitted!');

      // Check if all players have submitted
      checkAllSubmitted();
    } catch (error) {
      console.error('Full error uploading drawing:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'Failed to submit drawing. ';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage += 'Storage permissions issue. Check Firebase Storage rules.';
      } else if (error.message?.includes('CORS')) {
        errorMessage += 'CORS issue - drawing upload may not work in web browser. Try on phone.';
      } else if (error.message?.includes('blob')) {
        errorMessage += 'Data format issue. The drawing format may not be compatible.';
      } else {
        errorMessage += `Error: ${error.message || 'Unknown error'}`;
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  const handleSkipDrawing = async () => {
    if (hasSubmitted) return;

    try {
      console.log('Skipping drawing (web/testing mode)...');
      
      // Create a simple blank/placeholder data URL (1x1 white pixel PNG)
      const blankImageDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      
      const response = await fetch(blankImageDataUrl);
      const blob = await response.blob();
      
      const drawingRef = storageRef(
        storage,
        `drawings/${roomCode}/${playerId}_round${1}.png`
      );

      await uploadBytes(drawingRef, blob, {
        contentType: 'image/png'
      });
      
      const downloadURL = await getDownloadURL(drawingRef);
      
      await update(
        ref(database, `rooms/${roomCode}/drawings/${playerId}`),
        {
          url: downloadURL,
          submittedAt: Date.now(),
          isPlaceholder: true, // Mark as placeholder for testing
        }
      );

      setHasSubmitted(true);
      Alert.alert('Skipped', 'Placeholder drawing submitted (testing mode)');
      checkAllSubmitted();
    } catch (error) {
      console.error('Error skipping:', error);
      Alert.alert('Error', 'Failed to skip. Please try again.');
    }
  };

  const checkAllSubmitted = async () => {
    const roomRef = ref(database, `rooms/${roomCode}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const roomData = snapshot.val();
      const playersCount = Object.keys(roomData.players || {}).length;
      const drawingsCount = Object.keys(roomData.drawings || {}).length;

      if (playersCount === drawingsCount) {
        // All players submitted, move to rating
        await update(ref(database, `rooms/${roomCode}`), {
          status: 'rating',
        });
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={[styles.topicLabel, { color: '#c7d2fe' }]}>Draw:</Text>
        <Text style={[styles.topicText, { color: '#fff' }]}>{topic}</Text>
        <Text
          style={[
            styles.timerText,
            { color: '#fff' },
            timeRemaining <= 10 && styles.timerWarning,
          ]}
        >
          ⏱️ {formatTime(timeRemaining)}
        </Text>
      </View>

      <View style={[styles.canvasContainer, { backgroundColor: '#fff' }]}>
        {timeRemaining > 0 ? (
          <DrawingCanvas
            onSave={handleDrawingSave}
            onClear={() => setDrawingData(null)}
          />
        ) : (
          <View style={[styles.timeUpOverlay, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.timeUpText, { color: theme.success }]}>⏰ Time's Up!</Text>
            <Text style={[styles.timeUpSubtext, { color: theme.textSecondary }]}>
              {hasSubmitted ? 'Drawing submitted' : 'Please submit your drawing'}
            </Text>
          </View>
        )}
      </View>

      {!hasSubmitted ? (
        <View>
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: theme.success }]}
            onPress={handleSubmitDrawing}
          >
            <Text style={styles.submitButtonText}>✓ Submit Drawing</Text>
          </TouchableOpacity>
          
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={[styles.skipButton, { backgroundColor: theme.warning }]}
              onPress={handleSkipDrawing}
            >
              <Text style={styles.skipButtonText}>⏭️ Skip (Browser/Testing)</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={[styles.waitingCard, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.waitingText, { color: theme.success }]}>
            ✓ Submitted! Waiting for other players...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  header: {
    
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  topicLabel: {
    fontSize: 16,

    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 1,
  },
  topicText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 14,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  timerWarning: {

  },
  canvasContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButton: {
    
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  skipButton: {
    
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 18,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  waitingCard: {
    
    margin: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  waitingText: {
    fontSize: 18,

    fontWeight: '700',
  },
  timeUpOverlay: {
    flex: 1,
    
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeUpText: {
    fontSize: 36,
    fontWeight: '800',

    marginBottom: 12,
  },
  timeUpSubtext: {
    fontSize: 19,

    fontWeight: '600',
  },
});
