# Onboarding Images

This folder contains the images used in the onboarding flow for Missile Wars.

## Required Images

Add the following images to this folder (recommended size: 512x512px or similar):

1. **welcome.png** - Welcome screen showing the Missile Wars logo or gameplay overview
2. **gameplay.png** - Map or location-based gameplay visualization
3. **missiles.png** - Missile launch or targeting interface
4. **landmines.png** - Landmine deployment or trap visualization
5. **multiplayer.png** - Player interaction or battle scene
6. **leagues.png** - Trophy or league ranking visualization
7. **permissions.png** - Settings or permissions icon

## Image Guidelines

- **Format**: PNG with transparency preferred
- **Size**: 512x512px recommended (will be scaled automatically)
- **Style**: Match the game's visual style with vibrant colors
- **Background**: Transparent or themed to match gradient colors in PermissionsScreen.tsx

## Current Status

Currently using placeholder images from `assets/concept/Map.png`. Replace the image paths in `/app/PermissionsScreen.tsx` (lines 48-56) once you add your custom images.

## How to Update

1. Add your images to this folder
2. Open `/app/PermissionsScreen.tsx`
3. Update the `ONBOARDING_IMAGES` object (around line 48) to use your new images:

```typescript
const ONBOARDING_IMAGES = {
  welcome: require('../assets/onboarding/welcome.png'),
  gameplay: require('../assets/onboarding/gameplay.png'),
  missiles: require('../assets/onboarding/missiles.png'),
  landmines: require('../assets/onboarding/landmines.png'),
  multiplayer: require('../assets/onboarding/multiplayer.png'),
  leagues: require('../assets/onboarding/leagues.png'),
  permissions: require('../assets/onboarding/permissions.png'),
};
```

## AI Image Generation Prompts

Use these prompts with DALL-E, Midjourney, or Stable Diffusion to generate your onboarding images:

### 1. welcome.png
```
A vibrant game logo illustration featuring a stylized missile with purple and pink gradients (#773765, #ff6b9d), explosive energy effects, mobile game icon style, clean design, transparent background, digital art, professional gaming aesthetic, high contrast, centered composition, 3D rendered look
```

### 2. gameplay.png
```
Isometric top-down view of a stylized map with location markers, glowing blue waypoints (#64b5f6), digital terrain grid, GPS coordinates overlay, futuristic HUD elements, mobile game UI style, clean and minimalist, vibrant colors, transparent background, game interface design
```

### 3. missiles.png
```
3D rendered tactical missile in flight with red fire trail (#ff5252), targeting reticle, motion blur effect, explosive energy, mobile game icon style, dramatic angle, vibrant colors, sci-fi military aesthetic, clean design, transparent background, professional game art
```

### 4. landmines.png
```
Cartoon-style landmine with glowing yellow warning indicators (#ffd700), danger symbols, explosive device, mobile game icon design, clean lines, vibrant colors, transparent background, playful yet tactical aesthetic, 3D rendered look, professional gaming art
```

### 5. multiplayer.png
```
Multiple stylized player avatars in battle formation, purple energy effects (#b388ff), team battle scene, mobile game characters, dynamic poses, action-packed composition, vibrant colors, clean design, transparent background, professional game art, modern gaming aesthetic
```

### 6. leagues.png
```
Golden trophy with star embellishments (#ffd700), championship medal, ranking badge design, competitive gaming icon, shiny metallic finish, mobile game UI element, vibrant and prestigious look, transparent background, 3D rendered style, professional esports aesthetic
```

### 7. permissions.png
```
Modern settings gear icon with green accent (#4CAF50), location pin symbol integrated, permission settings graphic, clean minimalist design, mobile app icon style, professional UI element, vibrant colors, transparent background, friendly and approachable aesthetic
```

## Design Tips

- **Style Consistency**: All images should use a similar art style (3D, flat, isometric, etc.)
- **Color Harmony**: Each image matches its slide's gradient - welcome (purple/pink), gameplay (blue), missiles (red), landmines (yellow), multiplayer (purple), leagues (gold), permissions (green)
- **No Glow Effects**: The app adds glowing effects automatically, so keep source images clean
- **Transparent Backgrounds**: PNG with alpha channel for best results
- **Simple Compositions**: Icons should be clear and recognizable at smaller sizes
- **Gaming Aesthetic**: Modern, vibrant, and energetic to appeal to game players

## Alternative: Using Existing Game Assets

If you have existing game assets (missile sprites, map screenshots, etc.), you can also:
1. Export clean versions of in-game elements at 512x512px
2. Add subtle shadows or outlines for depth
3. Ensure they look good on dark gradient backgrounds
4. Maintain consistent styling across all 7 images
