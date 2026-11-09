# Kelpbook Bridge

A static page for moving HYPE between HyperEVM and Elysium, in both directions.

Open `bridge/index.html` or serve the folder with any static host (`npx serve bridge`).

## Before going live

Fill in the `TODO` values in `config.js`:

- Elysium `chainId`, `rpcUrls`, `explorer` and `nativeCurrency`
- `bridgeContract` on each network
- the wrapped HYPE token address on Elysium (`assets[0].address.elysium`)

Until a network's `bridgeContract` is set, the page runs in **demo mode** for
transfers that start on that network: nothing is sent and the transfer is simulated.

## Contract interface

The page calls the source chain's bridge contract:

- `deposit(address recipient) payable`: native asset (HYPE on HyperEVM)
- `depositToken(address token, uint256 amount, address recipient)`: ERC-20, after `approve`

Change `abi` in `config.js` and the calls in `app.js` (`bridge()`) if the bridge uses a different interface.

`vendor/ethers.umd.min.js` is ethers v6.13.4 (MIT), bundled so the page does not depend on a CDN.
