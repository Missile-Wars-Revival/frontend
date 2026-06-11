import React, { useState } from 'react';
import { Image, type ImageProps } from 'expo-image';

const DEFAULT_IMAGE = require('../../assets/mapassets/Female_Avatar_PNG.png');

/**
 * Renders a profile avatar from a server-resolved URL, falling back to the default
 * avatar when the URL is missing/null or fails to load. Replaces the old
 * fetchAndCacheImage flow: URL resolution now happens server-side, and expo-image's
 * built-in disk cache (keyed by URL) handles byte caching — no AsyncStorage involved.
 */
export function Avatar({ uri, ...props }: { uri?: string | null } & Omit<ImageProps, 'source'>) {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      {...props}
      source={uri && !failed ? { uri } : DEFAULT_IMAGE}
      onError={() => setFailed(true)}
      cachePolicy="disk"
      transition={150}
    />
  );
}
