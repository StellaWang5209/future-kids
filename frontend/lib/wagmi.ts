"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { localhost, sepolia } from "wagmi/chains";

/**
 * Wallet configuration.
 *
 * Kid-friendly by design: the game works fully in Demo Mode without a wallet.
 * When a guardian connects a wallet, achievements are written to:
 *   - Ethereum Sepolia testnet (today)
 *   - a local Anvil/Ganache node at 127.0.0.1:8545 (for development)
 *
 * WalletConnect requires a project id. For production, create your own free
 * project at https://cloud.walletconnect.com and set
 * NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.
 */
export const config = getDefaultConfig({
  appName: "Future Kids | 未来小孩",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "future-kids-public-good-demo",
  chains: [sepolia, localhost],
  transports: {
    [sepolia.id]: http(),
    [localhost.id]: http("http://127.0.0.1:8545"),
  },
});

/** Contracts are optional: without them the game runs purely in Demo Mode. */
export const contractAddresses = {
  identity: process.env.NEXT_PUBLIC_IDENTITY_ADDRESS ?? "",
  proof: process.env.NEXT_PUBLIC_PROOF_ADDRESS ?? "",
  badge: process.env.NEXT_PUBLIC_BADGE_ADDRESS ?? "",
};

export const contractsConfigured = Boolean(
  contractAddresses.identity && contractAddresses.proof && contractAddresses.badge
);

/** ContributionRegistry is optional and read-mostly from the frontend. */
export const registryAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ?? "";
export const registryConfigured = Boolean(registryAddress);
