import { Audio } from 'expo-av';

// Function to play the death sound
export async function playDeathSound() {
    try {
      // Load the sound file
      const { sound } = await Audio.Sound.createAsync(
        require('../sounds/death_sound.mp3')
      );
  
      // Play the sound
      await sound.playAsync();
  
    } catch (error) {
      console.error('Failed to load and play the sound:', error);
    }
  }