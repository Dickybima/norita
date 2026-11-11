# Norita

A cozy pixel farming game on Robinhood Chain. Plant seeds, watch them grow and harvest them
for **NORITA**. Level up to unlock better seeds and buy more land, in a world with day,
night and four seasons.

X: [@noritafarm](https://x.com/noritafarm)

## What's in this repo

| Path | What it is |
|---|---|
| `index.html` | Home page |
| `farm/` | The game: page, game logic, animated farm scene, crop sprites, `NoritaFarm.sol` contract. See `farm/README.md`. |
| `bridge/` | Bridge for moving ETH between Ethereum and Robinhood Chain (not linked from the site; the farm loads ethers from `bridge/vendor/`). See `bridge/README.md`. |
| `wallet/` | Wallet picker shared by the Farm and Bridge pages |
| `assets/` | Logo, gameplay video, X images and teaser. See `assets/README.md`. |

## Run it

It is a static site with no build step. Serve the repository root:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. On Vercel, deploy the repository root with no build command.

## Early access

The farm is behind an X whitelist (follow, like, quote) and stays closed until
`whitelist.gameOpen` is set to `true` in `farm/config.js`.
