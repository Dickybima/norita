# Norita

A cozy pixel farming game on Elysium. Plant seeds, watch them grow and harvest them
for **NRT**. Level up to unlock better seeds and buy more land, in a world with day,
night and four seasons.

X: [@noritafarm](https://x.com/noritafarm)

Official $NRT contract address: `0x38bdcfcd75da18f8364553a90eea9e4a8a0cd122`

## What's in this repo

| Path | What it is |
|---|---|
| `index.html` | Home page |
| `farm/` | The game: page, game logic, animated farm scene, crop sprites, `NoritaFarm.sol` contract. See `farm/README.md`. |
| `bridge/` | Bridge for moving HYPE between HyperEVM and Elysium. See `bridge/README.md`. |
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
