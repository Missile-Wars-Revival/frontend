import React from 'react';
import {
  Host,
  List,
  HStack,
  Spacer,
  Text,
  Button,
  SwipeActions,
  RNHostView,
} from '@expo/ui/swift-ui';
import { padding, foregroundColor } from '@expo/ui/swift-ui/modifiers';
import { Avatar } from '../ui/Avatar';
import type { FriendsListProps } from './FriendsList';

/**
 * Native SwiftUI friends list (iOS). Each row is a tappable button that opens
 * the friend's profile; swiping a row reveals native "Fire" / "Remove" actions.
 * Remote avatars are rendered with expo-image embedded via RNHostView, since
 * SwiftUI's Image only supports SF Symbols / local images.
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
      <List>
        {friends.map((friend) => (
          <SwipeActions key={friend.username}>
            <Button onPress={() => onProfilePress(friend.username)}>
              <HStack spacing={12} modifiers={[padding({ top: 6, bottom: 6 })]}>
                <RNHostView matchContents>
                  <Avatar
                    uri={friend.profileImageUrl}
                    style={{ width: 44, height: 44, borderRadius: 22 }}
                  />
                </RNHostView>
                <Text modifiers={[foregroundColor(isDarkMode ? '#FFFFFF' : '#000000')]}>
                  {friend.username}
                </Text>
                <Spacer />
              </HStack>
            </Button>
            <SwipeActions.Actions>
              {showFire ? (
                <Button
                  label="Fire"
                  systemImage="paperplane.fill"
                  onPress={() => onFirePress(friend.username)}
                />
              ) : null}
              <Button
                role="destructive"
                label="Remove"
                systemImage="trash"
                onPress={() => onRemovePress(friend.username)}
              />
            </SwipeActions.Actions>
          </SwipeActions>
        ))}
      </List>
    </Host>
  );
}
