"use client";

import { useEffect } from "react";
import { useWeb3Store } from "@/store/useWeb3Store";


export default function Web3Provider({
  children,
}: {
  children: React.ReactNode;
}) {
  const initWallet = useWeb3Store((state) => state.initWallet);
  

  useEffect(() => {
    initWallet();
  }, [initWallet]);

  return <>{children}</>;
}