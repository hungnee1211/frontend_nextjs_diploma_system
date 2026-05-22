'use client';
import { useState, useEffect } from 'react';
import { useWeb3Store } from '@/store/useWeb3Store';
import { isAddress, getAddress } from 'ethers';
import { toast } from 'sonner';
import { 
  PlusCircle, 
  ShieldCheck, 
  School, 
  ExternalLink, 
  Wallet,
  Search,
  CheckCircle2,
  XCircle,
  LogOut,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPage() {
  // Lấy dữ liệu từ Store toàn cục
  const { account, contract, connectWallet, isConnected, logout } = useWeb3Store();
  
  // State giao diện
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [schoolWallet, setSchoolWallet] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const [schoolsList, setSchoolsList] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);

  // 1. Đồng bộ sự kiện đổi ví từ MetaMask
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          logout();
        } else {
          connectWallet(); // Tự động cập nhật lại account trong store
        }
      };
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      };
    }
  }, [logout, connectWallet]);

  // 2. Logic lấy danh sách trường (Giữ nguyên)
  const fetchSchools = async () => {
    if (!contract) return;
    try {
      setFetching(true);
      if (typeof contract.getSchoolAddressList !== 'function') return;

      const addresses = await contract.getSchoolAddressList();
      const details = await Promise.all(
        addresses.map(async (addr: any) => {
          const info = await contract.schools(addr);
          return { 
            wallet: addr, 
            name: info.name, 
            isActive: info.isActive 
          };
        })
      );
      setSchoolsList(details);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (isConnected) fetchSchools();
  }, [isConnected, contract]);

  // 3. Logic thêm trường học (Giữ nguyên)
  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return toast.error("Chưa kết nối ví!");
    const rawAddress = schoolWallet.trim();
    if (!isAddress(rawAddress)) return toast.error("Địa chỉ ví không hợp lệ!");
    const cleanSchoolAddress = getAddress(rawAddress);

    const promise = async () => {
      setLoading(true);
      try {
        const tx = await contract.addSchool(cleanSchoolAddress, schoolName);
        await tx.wait();
        setSchoolWallet("");
        setSchoolName("");
        await fetchSchools();
      } catch (err: any) {
        throw err;
      } finally {
        setLoading(false);
      }
    };

    toast.promise(promise(), {
      loading: 'Đang ghi dữ liệu lên Sepolia...',
      success: 'Đã cấp quyền cho trường học mới!',
      error: (err) => err.reason || "Giao dịch bị từ chối",
    });
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col font-sans text-slate-900">
      
      {/* --- HEADER ĐỒNG BỘ --- */}
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 leading-none">EduChain</h1>
            <p className="text-[11px] text-slate-600 font-bold uppercase tracking-wider mt-1">Hệ thống Quản trị</p>
          </div>
        </div>
        
        {/* Wallet Dropdown Section */}
        <div className="relative">
          {!isConnected ? (
            <button 
              onClick={connectWallet}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              <Wallet size={16} /> Kết nối Ví
            </button>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-100 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                   <Wallet size={14} />
                </div>
                <span className="font-mono text-sm font-bold text-slate-700">
                  {account ? `${account.substring(0, 6)}...${account.substring(38)}` : ""}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    {/* Overlay để click ra ngoài thì đóng menu */}
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xl z-20"
                    >
                      <button 
                        onClick={() => { connectWallet(); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-sm font-bold text-slate-600"
                      >
                        <RefreshCw size={16} className="text-indigo-500" /> Đổi tài khoản
                      </button>
                      <div className="h-px bg-slate-100 my-1" />
                      <button 
                        onClick={() => { logout(); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-xl transition-colors text-sm font-bold text-red-500"
                      >
                        <LogOut size={16} /> Ngắt kết nối
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      {/* --- MAIN CONTENT (GIỮ NGUYÊN CODE CŨ) --- */}
      <main className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-0">
        
        {/* Form Đăng Ký */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50">
            <div className="mb-8">
              <h3 className="text-xl font-black text-slate-900">Cấp quyền trường</h3>
              <p className="text-sm text-slate-600 mt-2 font-medium">Thêm địa chỉ ví nhà trường vào Blockchain.</p>
            </div>

            <form onSubmit={handleAddSchool} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Địa chỉ ví</label>
                <input 
                  type="text" 
                  value={schoolWallet}
                  onChange={(e) => setSchoolWallet(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-4 bg-white border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all font-mono text-sm text-slate-800"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase ml-1">Tên trường</label>
                <input 
                  type="text" 
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Ví dụ: ĐH Bách Khoa HN"
                  className="w-full px-4 py-4 bg-white border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-800"
                  required
                />
              </div>

              <button 
                disabled={loading || !isConnected}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-base hover:bg-indigo-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Xác nhận ghi danh"}
                <PlusCircle size={20} />
              </button>
            </form>
          </div>
        </div>

        {/* Danh Sách Trường */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h3 className="text-xl font-black text-slate-900">Danh sách liên kết</h3>
                <p className="text-sm text-slate-600 font-medium">Dữ liệu thời gian thực từ Smart Contract.</p>
              </div>
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  placeholder="Tìm kiếm..."
                  className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 w-full md:w-64 outline-none"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100/50">
                    <th className="px-8 py-5 text-xs font-black text-slate-700 uppercase tracking-wider">Trường học</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-700 uppercase tracking-wider">Địa chỉ ví</th>
                    <th className="px-8 py-5 text-xs font-black text-slate-700 uppercase tracking-wider text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fetching ? (
                    <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-900 font-bold animate-pulse">Đang truy vấn Blockchain...</td></tr>
                  ) : schoolsList.length > 0 ? (
                    schoolsList.map((school, index) => (
                      <tr key={index} className="hover:bg-indigo-50/30 transition-all">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black shadow-sm">
                              {school.name.charAt(0)}
                            </div>
                            <span className="font-extrabold text-slate-900 text-base">{school.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => window.open(`https://sepolia.etherscan.io/address/${school.wallet}`)}
                            className="flex items-center gap-2 font-mono text-sm text-indigo-600 font-bold hover:underline"
                          >
                            {school.wallet.substring(0, 10)}...{school.wallet.substring(34)}
                            <ExternalLink size={14} />
                          </button>
                        </td>
                        <td className="px-8 py-6 text-center">
                          {school.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black border border-emerald-200">
                              <CheckCircle2 size={14} /> ACTIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-100 text-rose-800 rounded-full text-xs font-black border border-rose-200">
                              <XCircle size={14} /> REVOKED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-slate-400">
                          <School size={60} strokeWidth={1} />
                          <p className="text-lg font-bold">Dữ liệu đang trống</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}