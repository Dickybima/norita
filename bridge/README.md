# Norita Bridge

A static page for moving ETH between Ethereum and Robinhood Chain, in both directions.
On Robinhood Chain, ETH pays the gas for Norita farm transactions.

Robinhood Chain (chain ID 4663) is an Arbitrum Orbit chain: deposits arrive in minutes,
withdrawals back to Ethereum take about 7 days.

Open `bridge/index.html` or serve the folder with any static host (`npx serve bridge`).

## Before going live

Fill in the `TODO` values in `config.js`:

- check the Robinhood Chain `explorer` (and use a dedicated RPC provider for production)
- `bridgeContract` on each network

Until a network's `bridgeContract` is set, the page runs in **demo mode** for
transfers that start on that network: nothing is sent and the transfer is simulated.

## Contract interface

The page calls the source chain's bridge contract:

- `deposit(address recipient) payable`: native asset (ETH)
- `depositToken(address token, uint256 amount, address recipient)`: ERC-20, after `approve`

Change `abi` in `config.js` and the calls in `app.js` (`bridge()`) if the bridge uses a different interface.

`vendor/ethers.umd.min.js` is ethers v6.13.4 (MIT), bundled so the page does not depend on a CDN.
