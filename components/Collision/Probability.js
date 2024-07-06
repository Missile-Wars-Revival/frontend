export const goodLootItems = ["ClusterBomb", "CorporateRaider", "GutShot", "TheNuke", "Yokozuna", "Zippy"];

export const rarityProbability = {
  Common: 20,      // 10% chance for good loot
  Uncommon: 30,    // 30% chance
  Rare: 50         // 50% chance
};

export function getRandomLoot(rarity) {
  const chance = Math.random() * 100;
  if (chance < rarityProbability[rarity]) {
    const lootIndex = Math.floor(Math.random() * goodLootItems.length);
    return goodLootItems[lootIndex];
  } else {
    return null; // No good loot rewarded
  }
}
