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

// 🛠️ Hàm bổ trợ: Trích xuất nhà cung cấp ví sạch, chống xung đột extension
const getSafeEthereumProvider = () => {
  if (typeof window === "undefined" || !window.ethereum) return null;

  // Nếu trình duyệt cài nhiều ví cùng lúc, window.ethereum.providers sẽ tồn tại
  if (window.ethereum.providers && Array.isArray(window.ethereum.providers)) {
    // Tìm ví nào định danh là MetaMask chuẩn
    const metaMaskProvider = window.ethereum.providers.find((p: any) => p.isMetaMask);
    if (metaMaskProvider) return metaMaskProvider;
  }

  // Trường hợp thông thường hoặc chỉ có 1 ví duy nhất ghi đè
  return window.ethereum;
};

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
      const activeProvider = getSafeEthereumProvider();
      
      if (!activeProvider) {
        alert("Không tìm thấy ví MetaMask! Vui lòng cài đặt tiện ích mở rộng này.");
        return;
      }

      set({ isLoading: true });

      // Khởi tạo BrowserProvider dựa trên lớp ví an toàn đã lọc
      const provider = new ethers.BrowserProvider(activeProvider);

      // Gọi trực tiếp yêu cầu từ provider đã bóc tách để né file chen ngang evmAsk.js
      await activeProvider.request({ method: "eth_requestAccounts" });

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
      console.error("Lỗi chi tiết khi kết nối ví:", error);
      set({ isLoading: false });
      throw error; // Đẩy lỗi ra ngoài để UI Toast nhận được dữ liệu và hiển thị công khai
    }
  },

  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("wallet_connected");
    }

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
    const activeProvider = getSafeEthereumProvider();
    if (!activeProvider) return;

    try {
      const provider = new ethers.BrowserProvider(activeProvider);
      
      // Kiểm tra xem ví đã cấp quyền từ trước chưa (Tránh tự động bật popup phiền hà khi reload)
      const accounts = await activeProvider.request({ method: "eth_accounts" });
      const saved = typeof window !== "undefined" ? localStorage.getItem("wallet_connected") : null;

      // Giữ phiên kết nối sau khi F5 trang
      if (saved === "true" && accounts && accounts.length > 0) {
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

      // Đăng ký lắng nghe sự kiện thay đổi trạng thái ví (chỉ gắn 1 lần)
      if (!listenersAdded) {
        listenersAdded = true;

        activeProvider.on("accountsChanged", async (accounts: string[]) => {
          if (accounts.length === 0) {
            get().logout();
          } else {
            await get().connectWallet();
          }
        });

        activeProvider.on("chainChanged", async () => {
          // Khi đổi mạng lưới, reset lại cấu trúc ví mới hoàn toàn
          window.location.reload();
        });
      }
    } catch (error) {
      console.error("Lỗi khởi tạo trạng thái ví:", error);
    }
  },
}));