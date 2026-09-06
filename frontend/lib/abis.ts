/** Minimal human-readable ABIs for the Future Kids contract suite. */

export const identityAbi = [
  {
    type: "function",
    name: "createIdentity",
    stateMutability: "nonpayable",
    inputs: [{ name: "pseudonym", type: "string" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "identityOf",
    stateMutability: "view",
    inputs: [{ name: "learner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "levelOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "pseudonymOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

export const proofAbi = [
  {
    type: "function",
    name: "recordCompletion",
    stateMutability: "nonpayable",
    inputs: [
      { name: "chapterId", type: "uint8" },
      { name: "answer", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "hasCompleted",
    stateMutability: "view",
    inputs: [
      { name: "learner", type: "address" },
      { name: "chapterId", type: "uint8" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "completionCount",
    stateMutability: "view",
    inputs: [{ name: "learner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const badgeAbi = [
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [{ name: "badgeType", type: "uint8" }],
    outputs: [],
  },
  {
    type: "function",
    name: "hasBadge",
    stateMutability: "view",
    inputs: [
      { name: "learner", type: "address" },
      { name: "badgeType", type: "uint8" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "badgeName",
    stateMutability: "view",
    inputs: [{ name: "badgeType", type: "uint8" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const;
