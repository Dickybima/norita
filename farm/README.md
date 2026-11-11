# Norita

A cozy pixel-art farming game on Robinhood Chain. Plant crops on your plots, wait for them
to grow, and harvest them for **NORITA**. Spend NORITA on better seeds and more plots.

Behind the page runs a live farm scene (`scene.js`): a day/night cycle, four seasons,
a farmer, chickens, a windmill and weather. The world clock follows real time
(one in-game day = 4 minutes, one season = 7 days), so every visitor sees the same
hour and season. Crop art lives in `sprites.js`. All art is drawn in code.

Serve the repository root with any static host (`npx serve .`) and open `/farm/`.
The page loads ethers from `../bridge/vendor/`, so keep both folders together.

## How it plays

- **Start**: one-time `join()` gives 20 NORITA and 6 plots.
- **Plant**: pick a seed, tap an empty plot (or *Plant all empty*). The seed cost is burned.
- **Harvest**: once a crop is grown, *Harvest all* mints its reward and gives XP.
- **Level up**: every 100 XP is a level. Higher levels unlock better seeds.
- **Expand**: buy plots up to 12. The first extra plot costs 50 NORITA and the price doubles each time.

| Seed | Cost | Reward | Grow time | XP | Level |
|---|---|---|---|---|---|
| Turnip | 5 | 8 | 30s | 2 | 1 |
| Potato | 15 | 28 | 2m | 6 | 1 |
| Corn | 40 | 90 | 5m | 15 | 2 |
| Tomato | 120 | 300 | 15m | 40 | 4 |
| Pumpkin | 400 | 1100 | 1h | 120 | 6 |

## Whitelist (early access)

Before playing, each visitor must complete 3 steps on X: follow the Norita account,
like the launch post and quote it. Fill these in `config.js` under `whitelist`:

- `xHandle`: the X account to follow, without `@`
- `postUrl`: the post to like and quote, e.g. `https://x.com/NoritaFarm/status/1234567890`
- `quoteText`: the text pre-filled in the quote (players can change it)

Until `xHandle` and `postUrl` are set, the steps show "Soon" and nobody can enter.

While `gameOpen` is `false`, finishing the steps only claims a whitelist spot: the
player sees "You're on the whitelist!" and a button for the gameplay video, but
cannot play yet. Set `gameOpen: true` when early access opens, or `enabled: false`
to open the game to everyone.

## Gameplay video

`assets/norita-gameplay.mp4` (51 s, 1280×720) is recorded from the game itself with
`assets/record-gameplay.js`. The **▶ Video** button next to *Connect wallet* (and
*Watch video* on the home page) opens it in a pop-up (`assets/video-modal.js`).
To use another video, replace the file or change `data-video-src` on the buttons.

There is no X API check: a step counts as done once the player opens it, and the
pass is saved in that browser. It keeps casual visitors out but a determined person
can get around it. Checking follows and likes for real needs the paid X API and a
server.

## Demo mode

While `farmContract` in `config.js` is empty, the game runs in **demo mode**:
the same rules run in the browser and progress is saved in `localStorage`.
No wallet is needed.

## Going live on Robinhood Chain

1. Deploy `contracts/NoritaFarm.sol` (Solidity ^0.8.24, no dependencies) to Robinhood Chain (chain ID 4663, gas in ETH),
   for example with Remix or Foundry. The contract is also the NORITA ERC-20 token (name "Norita", ticker NORITA).
2. Fill in `farmContract` in `config.js`. The Robinhood Chain network settings are
   already there; check the explorer URL and use a dedicated RPC provider for production.
3. If you change crops or prices, change them in **both** the contract constructor
   and `config.js` (same order). The page uses `config.js` for display, the contract
   decides what actually happens.

Every action is one transaction: `join`, `plant`/`plantMany`, `harvestAll`, `buyPlot`.
The page reads the whole farm with `getFarm(address)`.

## Before real money is involved

- NORITA is minted by harvesting with no cap, so its supply grows with play. Plan the
  economy (sinks, caps, seasons) before NORITA gets a market value.
- Bots can farm as well as people. Fine for a game token, a problem for an airdrop.
- Get the contract audited before listing NORITA anywhere.
