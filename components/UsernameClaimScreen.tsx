import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette } from './ServerPicker';
import { auth } from '../util/firebase/firebaseAuth';
import { claimUsername } from '../api/account';

// Phase 8: shown by the session gate when a signed-in Firebase account has no
// game username yet — first-time Apple/Google sign-ins, or an email
// registration whose claim was lost to a race. The claim is transactional on
// the coordinator (global uniqueness), then the server selector follows.

const USERNAME_RE = /^[a-zA-Z0-9]{3,20}$/;

function suggestedUsername(): string {
  const displayName = auth.currentUser?.displayName ?? '';
  return displayName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
}

interface UsernameClaimScreenProps {
  onDone: (username: string) => void;
}

export default function UsernameClaimScreen({ onDone }: UsernameClaimScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const c = palette(isDark);

  const [username, setUsername] = useState(suggestedUsername());
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);

  const submit = useCallback(async () => {
    if (claiming) return;
    const trimmed = username.trim();
    if (!USERNAME_RE.test(trimmed)) {
      setError('Usernames are 3-20 letters and numbers.');
      return;
    }
    setError('');
    setClaiming(true);
    try {
      onDone(await claimUsername(trimmed));
    } catch (claimError) {
      const code = (claimError as Error).message;
      setError(
        code === 'USERNAME_TAKEN'
          ? 'That username is already taken — try another.'
          : 'Could not save your username. Check your connection and try again.'
      );
      setClaiming(false);
    }
  }, [claiming, username, onDone]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: c.text }]}>Choose your username</Text>
        <Text style={[styles.subtitle, { color: c.subtle }]}>
          This is how other players will see you — on every server, in chat, and on friend lists.
          It cannot be changed easily later.
        </Text>

        <TextInput
          style={[styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
          placeholder="Username"
          placeholderTextColor={c.subtle}
          value={username}
          onChangeText={(value) => {
            setUsername(value);
            setError('');
          }}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
          editable={!claiming}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable onPress={submit} style={[styles.button, claiming && styles.buttonDisabled]} disabled={claiming}>
          {claiming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
  },
  error: { color: '#e74c3c', fontSize: 13, marginTop: 10 },
  button: {
    marginTop: 18,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f7a36',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
