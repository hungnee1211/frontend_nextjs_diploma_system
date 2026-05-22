"use client";

import { create } from "zustand";
import { ethers } from "ethers";
import { abi, contractAddress } from "@/context/constract";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Web3State {
  account: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  contract: ethers.Contract | null;
  isConnected: boolean;
  isLoading: boolean;
  chainId: number | null;

  connectWallet: () => Promise<void>;
  logout: () => void;
  initWallet: () => Promise<void>;
}

let listenersAdded = false;

export const useWeb3Store = create<Web3State>((set, get) => ({
  account: null,
  provider: null,
  signer: null,
  contract: null,
  isConnected: false,
  isLoading: false,
  chainId: null,


  

  connectWallet: async () => {
    try {
      if (!window.ethereum) {
        alert("Cài MetaMask");
        return;
      }

      set({ isLoading: true });

      const provider = new ethers.BrowserProvider(window.ethereum);

      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      const network = await provider.getNetwork();

      const contract = new ethers.Contract(
        contractAddress,
        abi,
        signer
      );

      set({
        provider,
        signer,
        account,
        contract,
        isConnected: true,
        isLoading: false,
        chainId: Number(network.chainId),
      });

      localStorage.setItem("wallet_connected", "true");

    } catch (error) {
      console.log(error);
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("wallet_connected");

    set({
      account: null,
      provider: null,
      signer: null,
      contract: null,
      isConnected: false,
      chainId: null,
    });
  },

  initWallet: async () => {
    if (!window.ethereum) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      const accounts = await provider.send("eth_accounts", []);

      const saved = localStorage.getItem("wallet_connected");

      // giữ kết nối sau reload
      if (saved === "true" && accounts.length > 0) {
        const signer = await provider.getSigner();
        const account = await signer.getAddress();
        const network = await provider.getNetwork();

        const contract = new ethers.Contract(
          contractAddress,
          abi,
          signer
        );

        set({
          provider,
          signer,
          account,
          contract,
          isConnected: true,
          chainId: Number(network.chainId),
        });
      }

      // chỉ add listener 1 lần toàn app
      if (!listenersAdded) {
        listenersAdded = true;

        window.ethereum.on(
          "accountsChanged",
          async (accounts: string[]) => {
            if (accounts.length === 0) {
              get().logout();
            } else {
              await get().connectWallet();
            }
          }
        );

        window.ethereum.on("chainChanged", async () => {
          await get().connectWallet();
        });
      }
    } catch (error) {
      console.log(error);
    }
  },

  
}));