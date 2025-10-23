import * as chains from "viem/chains";

export type ScaffoldConfig = {
  targetNetworks: readonly chains.Chain[];
  pollingInterval: number;
  alchemyApiKey: string;
  walletConnectProjectId: string;
  onlyLocalBurnerWallet: boolean;
  walletAutoConnect: boolean;
  rpcOverrides?: Record<number, string>;
};

export const DEFAULT_ALCHEMY_API_KEY = "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF";

const scaffoldConfig = {
  // Только локальная сеть Hardhat
  targetNetworks: [chains.hardhat],

  pollingInterval: 30000,

  // Для локальной разработки используем дефолтные значения
  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "oKxs-03sij-U_N0iOlrSsZFr29-IqbuF",
  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",

  // Burner Wallet ТОЛЬКО на локальной сети
  onlyLocalBurnerWallet: true,

  // Автоматическое подключение Burner Wallet
  walletAutoConnect: true,

  // RPC overrides для локальной разработки
  rpcOverrides: {},
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
