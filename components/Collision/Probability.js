export const goodLootItems = [
  { name: "ClusterBomb", category: "Missiles" },
  { name: "CorporateRaider", category: "Missiles" },
  { name: "GutShot", category: "Missiles" },
  { name: "Yokozuna", category: "Missiles" },
  { name: "Zippy", category: "Missiles" },
  { name: "BunkerBlocker", category: "Landmines" },
  { name: "Buzzard", category: "Missiles" }
];

export const notSoGoodLootItems = [
  { name: "Bombabom", category: "Landmines" },
  { name: "BigBertha", category: "Landmines" },
  { name: "Ballista", category: "Missiles" },
  { name: "Amplifier", category: "Missiles" },
  { name: "LootDrop", category: "Loot Drops" },
  { name: "Coins", category: "Currency" }
];

export const rarityProbability = {
  Common: 20,      // 20% chance for good loot
  Uncommon: 30,    // 30% chance
  Rare: 50         // 50% chance
};

export function getRandomLoot(rarity) {
  const chance = Math.random() * 100;
  if (chance < rarityProbability[rarity]) {
    const lootIndex = Math.floor(Math.random() * goodLootItems.length);
    return goodLootItems[lootIndex];
  } else {
    const notSoGoodIndex = Math.floor(Math.random() * notSoGoodLootItems.length);
    return notSoGoodLootItems[notSoGoodIndex];
  }
}


//Missile types
//   Amplifier:
//   Ballista: 
//   BigBertha:
//   Bombabom: 
//   BunkerBlocker:
//   Buzzard: 
//   ClusterBomb: 
//   CorporateRaider: 
//   GutShot: 
//   TheNuke: 
//   Yokozuna: 
//   Zippy: 