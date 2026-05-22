'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ShieldCheck,
  FilePlus,
  GraduationCap,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ArrowRight,
  Award,
} from "lucide-react";

import { useWeb3Store } from "@/store/useWeb3Store";
import Link from "next/link";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Wallet state từ Zustand
  const { account, isConnected, connectWallet, logout } = useWeb3Store();

  // Ngắt kết nối
  const disconnectWallet = () => {
    logout();
    setIsDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-500/20 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[130px]" />
      </div>

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo đồng bộ */}
          <Link href="/" className="flex items-center gap-3 group cursor-pointer">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
              EDU.<span className="text-emerald-600">BLOCKCHAIN</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
            <Link href="/admin" className="hover:text-emerald-600 transition-colors">
              Admin
            </Link>

            <Link
              href="/issure"
              className="hover:text-emerald-600 transition-colors flex items-center gap-1.5"
            >
              <FilePlus size={16} /> Issuer
            </Link>

            <Link
              href="/verify"
              className="hover:text-emerald-600 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck size={16} /> Verify
            </Link>

            {/* Wallet Button */}
            <div className="relative ml-4">
              {!isConnected ? (
                <button
                  onClick={connectWallet}
                  className="bg-slate-900 text-white px-6 py-2.5 rounded-full font-black text-xs tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-2 active:scale-95 shadow-md shadow-slate-900/10"
                >
                  <Wallet size={16} />
                  KẾT NỐI VÍ
                </button>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 bg-white border border-slate-200 px-4 py-2 rounded-2xl hover:bg-slate-50 transition-all text-slate-700 shadow-sm"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                      <Wallet size={14} />
                    </div>
                    <span className="font-mono text-xs font-bold">
                      {`${account?.slice(0, 6)}...${account?.slice(-4)}`}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 z-50 text-left"
                      >
                        <button
                          onClick={disconnectWallet}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors font-bold"
                        >
                          <LogOut size={16} />
                          Đăng xuất
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-700 hover:text-emerald-600 transition-colors p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-slate-100 bg-white/90 backdrop-blur-lg absolute w-full z-40 overflow-hidden text-left shadow-lg"
          >
            <div className="px-6 py-6 space-y-4 flex flex-col font-bold text-slate-600">
              <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="hover:text-emerald-600 py-2">
                Admin
              </Link>
              <Link href="/issure" onClick={() => setIsMenuOpen(false)} className="hover:text-emerald-600 py-2 flex items-center gap-2">
                <FilePlus size={16} /> Issuer
              </Link>
              <Link href="/verify" onClick={() => setIsMenuOpen(false)} className="hover:text-emerald-600 py-2 flex items-center gap-2">
                <ShieldCheck size={16} /> Verify
              </Link>
              <div className="pt-4 border-t border-slate-100">
                {!isConnected ? (
                  <button
                    onClick={() => { connectWallet(); setIsMenuOpen(false); }}
                    className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs tracking-widest flex items-center justify-center gap-2"
                  >
                    <Wallet size={16} /> KẾT NỐI VÍ
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      <span>{account}</span>
                    </div>
                    <button
                      onClick={() => { disconnectWallet(); setIsMenuOpen(false); }}
                      className="w-full bg-red-50 text-red-600 py-3 rounded-xl text-xs font-black tracking-widest flex items-center justify-center gap-2"
                    >
                      <LogOut size={16} /> ĐĂNG XUẤT
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO SECTION */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center flex flex-col items-center min-h-[calc(100vh-80px)] justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-bold tracking-wider uppercase mb-8"
        >
          <Award size={14} /> Blockchain Academic Credentials
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight max-w-4xl leading-none"
        >
          Minh Bạch Hoá <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
            Bằng Cấp & Chứng Chỉ
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-slate-500 font-medium text-lg md:text-xl max-w-2xl mt-6 leading-relaxed"
        >
          Hệ thống lưu trữ và tra cứu văn bằng phi tập trung trên nền tảng Blockchain. Chống làm giả, xác thực tức thời và bảo mật tuyệt đối.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link href="/verify" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-sm tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
              TRA CỨU VĂN BẰNG <ArrowRight size={16} />
            </button>
          </Link>
          
          <Link href="/issure" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl font-black text-sm tracking-widest active:scale-95 transition-all">
              CỔNG PHÁT HÀNH
            </button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}