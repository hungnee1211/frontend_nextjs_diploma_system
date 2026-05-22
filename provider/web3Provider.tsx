"use client";

import React, { useEffect } from "react";
import { useWeb3Store } from "@/store/useWeb3Store";

// Import các thư viện mới cho RainbowKit & Wagmi
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// 1. Cấu hình cấu trúc mạng và DApp cho RainbowKit
const config = getDefaultConfig({
  appName: "Diploma Verification System",
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID", // Có thể điền chuỗi bất kỳ hoặc đăng ký tại cloud.walletconnect.com
  chains: [sepolia], // Chỉ định cấu hình chạy mạng Sepolia Testnet
  ssr: true, // Bật tính năng tối ưu SSR tránh lỗi Hydration cho NextJS
});

// 2. Khởi tạo thực thể TanStack Query Client
const queryClient = new QueryClient();

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initWallet = useWeb3Store((state) => state.initWallet);

  // Giữ nguyên chức năng cũ: Khởi tạo ví từ store khi app vừa load
  useEffect(() => {
    initWallet();
  }, [initWallet]);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="vi-VN">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}