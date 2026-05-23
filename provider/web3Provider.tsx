"use client";

import React, { useEffect, useState } from "react";
import { useWeb3Store } from "@/store/useWeb3Store";

// Import các thư viện mới cho RainbowKit & Wagmi
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// 1. Cấu hình cấu trúc mạng và DApp cho RainbowKit
const config = getDefaultConfig({
  appName: "Diploma Verification System",
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID", // Nên thay bằng ID thật nếu bị lỗi kết nối trên điện thoại
  chains: [sepolia], 
  ssr: true, // Giữ nguyên để tối ưu hóa SSR ban đầu
});

export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initWallet = useWeb3Store((state) => state.initWallet);
  
  // Giải pháp 1: Tránh lag/lệch HTML bằng cách đợi Client load xong hoàn toàn
  const [mounted, setMounted] = useState(false);

  // Giải pháp 2: Khởi tạo QueryClient bên trong React State (Singleton) 
  // Cách này giúp giữ nguyên cache của các request ví, không bị tạo mới lại khi re-render
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false, // Tắt tự động refetch khi chuyển tab giúp app mượt hơn
        retry: 1,
      },
    },
  }));

  useEffect(() => {
    setMounted(true);
    initWallet();
  }, [initWallet]);

  // Nếu đang ở Server hoặc Client chưa load xong, chỉ render cấu trúc thô (hoặc loading spinner nếu muốn)
  // Việc này giúp loại bỏ hoàn toàn tình trạng đơ/lag nút bấm kết nối khi vừa vào trang
  if (!mounted) {
    return (
      <div style={{ visibility: "hidden" }}>
        {children}
      </div>
    );
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* Thêm cấu hình theme để RainbowKit tối ưu hóa việc render modal mượt hơn */}
        <RainbowKitProvider 
          locale="vi-VN"
          theme={lightTheme({
            accentColor: '#3b82f6', // Màu nút bấm (ví dụ: xanh dương Tailwind)
            borderRadius: 'medium',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}