import React from 'react';
import {
  Host,
  LazyColumn,
  Row,
  Text,
  Spacer,
  IconButton,
  RNHostView,
} from '@expo/ui/jetpack-compose';
import { fillMaxSize, fillMaxWidth, padding, weight, clickable } from '@expo/ui/jetpack-compose/modifiers';
import { Image as ExpoImage } from 'expo-image';
import type { FriendsListProps } from './FriendsList';

/**
 * Native Jetpack Compose friends list (Android). Rows are clickable (open the
 * friend's profile) with trailing icon buttons for "fire missile" / "remove".
 * Remote avatars use expo-image embedded via RNHostView.
 */
export default function FriendsList({
  friends,
  isDarkMode,
  showFire,
  onProfilePress,
  onFirePress,
  onRemovePress,
}: FriendsListProps) {
  return (
    <Host style={{ flex: 1 }}>
      <LazyColumn modifiers={[fillMaxSize()]} verticalArrangement={{ spacedBy: 4 }}>
        {friends.map((friend) => (
          <Row
            key={friend.username}
            verticalAlignment="center"
            modifiers={[
              fillMaxWidth(),
              clickable(() => onProfilePress(friend.username)),
              padding(16, 10, 16, 10),
            ]}
          >
            <RNHostView matchContents>
              <ExpoImage
                source={{ uri: friend.profileImageUrl }}
                style={{ width: 44, height: 44, borderRadius: 22 }}
                cachePolicy="memory-disk"
              />
            </RNHostView>
            <Text
              modifiers={[padding(12, 0, 0, 0)]}
              color={isDarkMode ? '#FFFFFF' : '#000000'}
              style={{ fontSize: 16, fontWeight: 'bold' }}
            >
              {friend.username}
            </Text>
            <Spacer modifiers={[weight(1)]} />
            {showFire ? (
              <IconButton onClick={() => onFirePress(friend.username)}>
                <Text style={{ fontSize: 18 }}>🚀</Text>
              </IconButton>
            ) : null}
            <IconButton onClick={() => onRemovePress(friend.username)}>
              <Text style={{ fontSize: 18 }}>✕</Text>
            </IconButton>
          </Row>
        ))}
      </LazyColumn>
    </Host>
  );
}
