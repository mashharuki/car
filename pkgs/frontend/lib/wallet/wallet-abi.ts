export const LICENSE_PLATE_FACTORY_ABI = [
  {
    type: "function",
    name: "createAccountFromPlate",
    stateMutability: "nonpayable",
    inputs: [
      { name: "owner", type: "address" },
      { name: "vehicleCommitment", type: "bytes32" },
      { name: "salt", type: "uint256" },
      { name: "proof", type: "bytes" },
    ],
    outputs: [{ name: "account", type: "address" }],
  },
  {
    type: "function",
    name: "getAddressFromPlate",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "vehicleCommitment", type: "bytes32" },
      { name: "salt", type: "uint256" },
    ],
    outputs: [{ name: "account", type: "address" }],
  },
] as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;
