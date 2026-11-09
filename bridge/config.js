// Bridge configuration. Fill in the TODO values before going live.
// While a chain's `bridgeContract` is empty, the page runs in DEMO mode:
// transfers are simulated and no transaction is sent.
window.BRIDGE_CONFIG = {
  networks: {
    hype: {
      key: "hype",
      name: "HyperEVM",
      short: "HYPE",
      chainId: 999,
      rpcUrls: ["https://rpc.hyperliquid.xyz/evm"],
      explorer: "https://hyperevmscan.io",
      nativeCurrency: { name: "HYPE", symbol: "HYPE", decimals: 18 },
      bridgeContract: "", // TODO: bridge contract address on HyperEVM
      color: "#5ef0c9",
    },
    elysium: {
      key: "elysium",
      name: "Elysium",
      short: "ELY",
      chainId: 0, // TODO: Elysium mainnet chain ID
      rpcUrls: [""], // TODO: Elysium RPC URL
      explorer: "", // TODO: Elysium block explorer URL
      nativeCurrency: { name: "Elysium", symbol: "ELY", decimals: 18 }, // TODO: confirm
      bridgeContract: "", // TODO: bridge contract address on Elysium
      color: "#a98bff",
    },
  },
  // Assets that can be bridged. `address` per network: "native" or an ERC-20 address.
  assets: [
    { symbol: "HYPE", decimals: 18, address: { hype: "native", elysium: "" /* TODO: wrapped HYPE on Elysium */ } },
  ],
  feeBps: 10, // 0.10% bridge fee (shown in the summary)
  etaMinutes: { hype: 3, elysium: 3 }, // estimated arrival time, keyed by destination
  // Bridge contract interface: deposit(address recipient) for native,
  // depositToken(address token, uint256 amount, address recipient) for ERC-20.
  abi: [
    "function deposit(address recipient) payable",
    "function depositToken(address token, uint256 amount, address recipient)",
  ],
};
