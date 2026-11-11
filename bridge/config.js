// Bridge configuration: ETH between Ethereum and Robinhood Chain.
// While a chain's `bridgeContract` is empty, the page runs in DEMO mode:
// transfers are simulated and no transaction is sent.
window.BRIDGE_CONFIG = {
  networks: {
    ethereum: {
      key: "ethereum",
      name: "Ethereum",
      short: "ETH",
      chainId: 1,
      rpcUrls: ["https://ethereum-rpc.publicnode.com"],
      explorer: "https://etherscan.io",
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      bridgeContract: "", // TODO: bridge contract address on Ethereum
      color: "#8fa4ff",
    },
    robinhood: {
      key: "robinhood",
      name: "Robinhood Chain",
      short: "RH",
      chainId: 4663, // Robinhood Chain mainnet (0x1237)
      rpcUrls: ["https://rpc.mainnet.chain.robinhood.com"], // public, rate-limited; use a provider for production
      explorer: "https://robinhoodchain.blockscout.com", // confirm on Robinhood's docs before launch
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }, // gas on Robinhood Chain is ETH
      bridgeContract: "", // TODO: bridge contract address on Robinhood Chain
      color: "#c8ff3a",
    },
  },
  start: "ethereum", // direction shown first: from this network to the other one
  // Assets that can be bridged. `address` per network: "native" or an ERC-20 address.
  assets: [
    { symbol: "ETH", decimals: 18, address: { ethereum: "native", robinhood: "native" } },
  ],
  feeBps: 10, // 0.10% bridge fee (shown in the summary)
  // Estimated arrival time in minutes, keyed by destination. Robinhood Chain is an
  // Arbitrum Orbit chain: deposits arrive in minutes, withdrawals to Ethereum take ~7 days.
  etaMinutes: { robinhood: 15, ethereum: 7 * 24 * 60 },
  gasReserve: 0.002, // ETH left in the wallet when MAX is used, for gas
  // Bridge contract interface: deposit(address recipient) for native,
  // depositToken(address token, uint256 amount, address recipient) for ERC-20.
  abi: [
    "function deposit(address recipient) payable",
    "function depositToken(address token, uint256 amount, address recipient)",
  ],
};
