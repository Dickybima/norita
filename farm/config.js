// Kelp Farm configuration. Fill in the TODO values before going live.
// While `farmContract` is empty, the game runs in DEMO mode: progress is saved
// in this browser only and no transaction is sent.
window.FARM_CONFIG = {
  network: {
    name: "Elysium",
    chainId: 0, // TODO: Elysium mainnet chain ID
    rpcUrls: [""], // TODO: Elysium RPC URL
    explorer: "", // TODO: Elysium block explorer URL
    nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 }, // gas token on Elysium
  },
  farmContract: "", // TODO: deployed KelpFarm address on Elysium (contracts/KelpFarm.sol)

  // Must match the constructor of contracts/KelpFarm.sol (same order = same id).
  crops: [
    { name: "Sea Lettuce", icon: "🥬", cost: 5, reward: 8, growTime: 30, xp: 2, minLevel: 1 },
    { name: "Kelp", icon: "🌿", cost: 15, reward: 28, growTime: 120, xp: 6, minLevel: 1 },
    { name: "Sea Grapes", icon: "🍇", cost: 40, reward: 90, growTime: 300, xp: 15, minLevel: 2 },
    { name: "Coral Bloom", icon: "🪸", cost: 120, reward: 300, growTime: 900, xp: 40, minLevel: 4 },
    { name: "Pearl Oyster", icon: "🦪", cost: 400, reward: 1100, growTime: 3600, xp: 120, minLevel: 6 },
  ],
  startPlots: 6,
  maxPlots: 12,
  starterGrant: 20,
  firstPlotPrice: 50, // doubles with each plot bought
  xpPerLevel: 100,

  abi: [
    "function join()",
    "function joined(address) view returns (bool)",
    "function plant(uint8 plot, uint8 crop)",
    "function plantMany(uint8[] plotIds, uint8 crop)",
    "function harvest(uint8 plot)",
    "function harvestAll()",
    "function buyPlot()",
    "function getFarm(address) view returns (uint8[] crop, uint64[] plantedAt, uint8 count, uint32 playerXp, uint256 balance)",
  ],
};
