import { createAudioPlayer } from 'expo-audio';

// Function to play the death sound
export async function playDeathSound() {
  try {
    // Create an imperative player (this is a fire-and-forget util, not a component,
    // so the useAudioPlayer hook can't be used here).
    const player = createAudioPlayer(require('../sounds/death_sound.mp3'));
    player.play();

    // The death sound is short; release native resources once it has finished.
    setTimeout(() => {
      try {
        player.remove();
      } catch {
        // player may already be released
      }
    }, 10000);
  } catch (error) {
    console.error('Failed to load and play the sound:', error);
  }
}
