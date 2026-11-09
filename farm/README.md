# Kelp Farm

A cozy pixel-art farming game on Elysium. Plant crops on your plots, wait for them
to grow, and harvest them for **KELP**. Spend KELP on better seeds and more plots.

Behind the page runs a live farm scene (`scene.js`): a day/night cycle, four seasons,
a farmer, chickens, a windmill and weather. The world clock follows real time
(one in-game day = 4 minutes, one season = 7 days), so every visitor sees the same
hour and season. Crop art lives in `sprites.js`. All art is drawn in code.

Serve the repository root with any static host (`npx serve .`) and open `/farm/`.
The page loads ethers from `../bridge/vendor/`, so keep both folders together.

## How it plays

- **Start**: one-time `join()` gives 20 KELP and 6 plots.
- **Plant**: pick a seed, tap an empty plot (or *Plant all empty*). The seed cost is burned.
- **Harvest**: once a crop is grown, *Harvest all* mints its reward and gives XP.
- **Level up**: every 100 XP is a level. Higher levels unlock better seeds.
- **Expand**: buy plots up to 12. The first extra plot costs 50 KELP and the price doubles each time.

| Seed | Cost | Reward | Grow time | XP | Level |
|---|---|---|---|---|---|
| Turnip | 5 | 8 | 30s | 2 | 1 |
| Potato | 15 | 28 | 2m | 6 | 1 |
| Corn | 40 | 90 | 5m | 15 | 2 |
| Tomato | 120 | 300 | 15m | 40 | 4 |
| Pumpkin | 400 | 1100 | 1h | 120 | 6 |

## Demo mode

While `farmContract` in `config.js` is empty, the game runs in **demo mode**:
the same rules run in the browser and progress is saved in `localStorage`.
No wallet is needed.

## Going live on Elysium

1. Deploy `contracts/KelpFarm.sol` (Solidity ^0.8.24, no dependencies) to Elysium,
   for example with Remix or Foundry. The contract is also the KELP ERC-20 token.
2. Fill in `config.js`: `network.chainId`, `network.rpcUrls`, `network.explorer`
   and `farmContract`.
3. If you change crops or prices, change them in **both** the contract constructor
   and `config.js` (same order). The page uses `config.js` for display, the contract
   decides what actually happens.

Every action is one transaction: `join`, `plant`/`plantMany`, `harvestAll`, `buyPlot`.
The page reads the whole farm with `getFarm(address)`.

## Before real money is involved

- KELP is minted by harvesting with no cap, so its supply grows with play. Plan the
  economy (sinks, caps, seasons) before KELP gets a market value.
- Bots can farm as well as people. Fine for a game token, a problem for an airdrop.
- Get the contract audited before listing KELP anywhere.
