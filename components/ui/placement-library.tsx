import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { getImages } from '../../api/store';
import useFetchInventory from '../../hooks/websockets/inventoryhook';
import { InventoryItem } from '../../types/types';
import { InventoryBottomSheet } from './inventory-bottom-sheet';
import {
  InventoryEmptyState,
  InventoryItemList,
  InventoryLibraryItem,
  InventoryLibraryShell,
} from './inventory-library';

type GradientColors = readonly [string, string, ...string[]];

/** Inventory rows for a single store category with quantity > 0. */
export function useInventoryByCategory(category: string): InventoryLibraryItem[] {
  const inventory = useFetchInventory();

  return inventory.reduce<InventoryLibraryItem[]>((acc, item: InventoryItem) => {
    if (item.category === category && item.quantity > 0) {
      acc.push({ type: item.name, quantity: item.quantity });
    }
    return acc;
  }, []);
}

/** Lazy-loaded product image resolver from the store API. */
export function useProductImageGetter() {
  const [getImage, setGetImage] = useState<(name: string) => unknown>(
    () => () => require('../../assets/logo.png')
  );

  useEffect(() => {
    void getImages().then((imageGetter) => setGetImage(() => imageGetter));
  }, []);

  return getImage;
}

export type PlacementSelectActions = {
  openPlacement: (type: string) => void;
};

export type PlacementPopupRenderProps = {
  visible: boolean;
  selectedType: string;
  onClose: () => void;
  onDismissed: () => void;
  onPlaced: () => void;
};

export type PlacementLibraryViewProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  accentColors: GradientColors;
  inventoryCategory: string;
  getImageSource?: (itemName: string, defaultGetImage: (name: string) => unknown) => unknown;
  onSelectItem?: (type: string, actions: PlacementSelectActions) => void;
  renderPlacementPopup: (props: PlacementPopupRenderProps) => React.ReactNode;
};

/**
 * Shared inventory picker + iOS-safe placement popup sequencing.
 * Entity-specific files only supply copy, category, and the placement popup.
 */
function usePlacementFlow(onCloseLibrary: () => void) {
  const [showPlacementPopup, setShowPlacementPopup] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const closeLibraryAfterPopupRef = useRef(false);

  const openPlacement = useCallback((type: string) => {
    setSelectedType(type);
    setShowPlacementPopup(true);
  }, []);

  const handleClosePopup = useCallback(() => {
    setShowPlacementPopup(false);
  }, []);

  const handlePlaced = useCallback(() => {
    // Close placement popup first; dismiss the sheet from onDismiss on iOS
    // (only one RN modal transition at a time).
    closeLibraryAfterPopupRef.current = true;
    setShowPlacementPopup(false);
    if (Platform.OS !== 'ios') {
      onCloseLibrary();
    }
  }, [onCloseLibrary]);

  const handlePopupDismissed = useCallback(() => {
    if (closeLibraryAfterPopupRef.current) {
      closeLibraryAfterPopupRef.current = false;
      onCloseLibrary();
    }
  }, [onCloseLibrary]);

  return {
    showPlacementPopup,
    selectedType,
    openPlacement,
    handleClosePopup,
    handlePlaced,
    handlePopupDismissed,
  };
}

export function PlacementLibraryView({
  visible,
  onClose,
  title,
  subtitle,
  accentColors,
  inventoryCategory,
  getImageSource,
  onSelectItem,
  renderPlacementPopup,
}: PlacementLibraryViewProps) {
  const isDarkMode = useColorScheme() === 'dark';
  const items = useInventoryByCategory(inventoryCategory);
  const defaultGetImage = useProductImageGetter();
  const {
    showPlacementPopup,
    selectedType,
    openPlacement,
    handleClosePopup,
    handlePlaced,
    handlePopupDismissed,
  } = usePlacementFlow(onClose);

  const handleSelect = useCallback(
    (type: string) => {
      if (onSelectItem) {
        onSelectItem(type, { openPlacement });
      } else {
        openPlacement(type);
      }
    },
    [onSelectItem, openPlacement]
  );

  const resolveImage = useCallback(
    (name: string) =>
      getImageSource ? getImageSource(name, defaultGetImage) : defaultGetImage(name),
    [getImageSource, defaultGetImage]
  );

  const goToShop = useCallback(() => {
    onClose();
    router.navigate('/store');
  }, [onClose]);

  return (
    <>
      <InventoryBottomSheet visible={visible} onClose={onClose}>
        <InventoryLibraryShell
          title={title}
          subtitle={subtitle}
          accentColors={accentColors}
          isDark={isDarkMode}
          onClose={onClose}
        >
          {items.length === 0 ? (
            <InventoryEmptyState isDark={isDarkMode} onGoToShop={goToShop} />
          ) : (
            <InventoryItemList
              items={items}
              isDark={isDarkMode}
              getImageSource={resolveImage}
              onSelect={handleSelect}
            />
          )}
        </InventoryLibraryShell>
      </InventoryBottomSheet>
      {/* Stay mounted after first selection — unmounting an open RN Modal on iOS skips onDismiss. */}
      {selectedType != null &&
        renderPlacementPopup({
          visible: showPlacementPopup,
          selectedType,
          onClose: handleClosePopup,
          onDismissed: handlePopupDismissed,
          onPlaced: handlePlaced,
        })}
    </>
  );
}