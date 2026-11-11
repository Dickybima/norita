// Norita configuration. Fill in the TODO values before going live.
// While `farmContract` is empty, the game runs in DEMO mode: progress is saved
// in this browser only and no transaction is sent.
window.FARM_CONFIG = {
  network: {
    name: "Robinhood Chain",
    chainId: 4663, // Robinhood Chain mainnet (0x1237)
    rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"], // public, rate-limited; use a provider for production
    explorer: "https://robinhoodchain.blockscout.com", // confirm on Robinhood's docs before launch
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, // gas on Robinhood Chain is ETH
  },
  farmContract: "", // TODO: deployed NoritaFarm address on Robinhood Chain (contracts/NoritaFarm.sol)

  // Early-access whitelist: players must follow, like and quote on X before they can play.
  // Each step opens X; the step counts as done once the player opens it (no X API check).
  // Until xHandle and postUrl are filled in, the steps stay locked and nobody can enter.
  whitelist: {
    enabled: true,
    xHandle: "noritafarm", // X account to follow, without @
    postUrl: "https://x.com/noritafarm/status/2119773944567767143", // X post to like and quote
    quoteText: "Just joined the Norita whitelist 🌱 A cozy pixel farm on Robinhood Chain. Plant, grow, harvest $NORITA.",
    // false: whitelisted players get their spot but cannot play yet (they can watch the video).
    // Set to true when early access opens.
    gameOpen: false,
  },

  // Must match the constructor of contracts/NoritaFarm.sol (same order = same id).
  crops: [
    { name: "Turnip", sprite: "turnip", cost: 5, reward: 8, growTime: 30, xp: 2, minLevel: 1 },
    { name: "Potato", sprite: "potato", cost: 15, reward: 28, growTime: 120, xp: 6, minLevel: 1 },
    { name: "Corn", sprite: "corn", cost: 40, reward: 90, growTime: 300, xp: 15, minLevel: 2 },
    { name: "Tomato", sprite: "tomato", cost: 120, reward: 300, growTime: 900, xp: 40, minLevel: 4 },
    { name: "Pumpkin", sprite: "pumpkin", cost: 400, reward: 1100, growTime: 3600, xp: 120, minLevel: 6 },
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
