'use client';
import { useState } from 'react';
import { ethers } from 'ethers'; 
import {
  ShieldCheck, Search, Fingerprint, AlertCircle,
  CheckCircle2, Calendar, User, Award
} from 'lucide-react';
import { toast } from 'sonner';

const CONTRACT_ADDRESS = "0x38e09B2a54c893260943Cb2031f5B5d0A71Cd01C";

const CONTRACT_ABI = [
  "function verifyDiploma(bytes32 _diplomaHash) public view returns (bool isValid, string memory studentCode, string memory schoolName, uint256 date)"
];

export default function VerifyPage() {
  const [searchHash, setSearchHash] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchHash.startsWith('0x') || searchHash.length !== 66) {
      return toast.error("Mã Hash không hợp lệ (phải bắt đầu bằng 0x và đủ độ dài)!");
    }

    setLoading(true);
    setResult(null);

    try {
      const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const readOnlyContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // Gọi hàm từ Smart Contract
      const data = await readOnlyContract.verifyDiploma(searchHash);

      // Ethers v6 trả về một mảng nhận diện mọc theo index hoặc key. 
      // Kiểm tra biến hợp lệ bằng cả 2 cách để tránh lỗi mapping của Node RPC
      const isValid = data && (data.isValid || data[0] === true);

      if (isValid) {
        // Trích xuất an toàn theo đúng thứ tự thuộc tính trong cấu trúc trả về của Smart Contract
        const studentCode = data.studentCode || data[1];
        const schoolName = data.schoolName || data[2];
        const rawDate = data.date || data[3];

        setResult({
          isValid: true,
          studentCode: studentCode || "Chưa cập nhật",
          schoolName: schoolName || "Chưa cập nhật",
          timestamp: new Date(Number(rawDate) * 1000).toLocaleDateString('vi-VN'),
        });
        toast.success("Xác thực thành công!");
      } else {
        setResult({ isValid: false });
        toast.error("Mã bằng này không tồn tại hoặc đã bị thu hồi!");
      }
    } catch (err: any) {
      console.error("Blockchain Error: ", err);
      setResult({ isValid: false });
      toast.error("Lỗi kết nối mạng Blockchain hoặc mã Hash sai định dạng!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <main className="p-8 max-w-4xl mx-auto w-full pt-20">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex p-4 bg-emerald-100 text-emerald-600 rounded-3xl mb-6 shadow-sm">
            <ShieldCheck size={40} strokeWidth={2.5} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Hệ Thống Xác Thực</h2>
          <p className="text-slate-500 mt-3 font-medium text-lg">Tra cứu bằng cấp công khai dành cho doanh nghiệp</p>
          <div className="mt-4 flex justify-center">
            <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold tracking-widest uppercase border border-slate-200">
              Public Read-Only Mode
            </span>
          </div>
        </div>

        {/* Search Box */}
        <div className="bg-white p-2 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-white mb-12 transition-all focus-within:ring-4 focus-within:ring-emerald-500/10">
          <form onSubmit={handleVerify} className="flex items-center">
            <div className="flex-1 flex items-center px-6 gap-3">
              <Search className="text-slate-400" size={20} />
              <input
                value={searchHash}
                onChange={(e) => setSearchHash(e.target.value)}
                placeholder="Dán mã Hash (0x...) vào đây để kiểm tra"
                className="w-full py-6 outline-none font-mono text-sm font-medium text-slate-700 bg-transparent"
              />
            </div>
            <button
              disabled={loading}
              className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-bold text-sm tracking-widest hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "ĐANG TRA CỨU..." : "XÁC THỰC"}
            </button>
          </form>
        </div>

        {/* Hiển thị kết quả */}
        {result && (
          <div className="animate-in zoom-in-95 duration-500">
            {result.isValid ? (
              <div className="bg-white rounded-[3rem] border-2 border-emerald-500/20 overflow-hidden shadow-2xl relative">
                <div className="bg-emerald-500 p-8 text-white flex items-center gap-4">
                  <CheckCircle2 size={32} />
                  <div>
                    <h3 className="text-xl font-bold uppercase tracking-wider">Chứng Chỉ Hợp Lệ</h3>
                    <p className="text-emerald-100 text-sm font-medium opacity-90">Bằng cấp này được ghi nhận trên mạng Sepolia Testnet</p>
                  </div>
                </div>

                <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                  {/* Tên trường */}
                  <ResultItem icon={<User size={18} />} label="Trường cấp phát" value={result.schoolName} />

                  {/* Mã sinh viên */}
                  <ResultItem icon={<Fingerprint size={18} />} label="Mã sinh viên" value={result.studentCode} />

                  {/* Ngày phát hành */}
                  <ResultItem icon={<Calendar size={18} />} label="Ngày phát hành" value={result.timestamp} />

                  {/* Trạng thái */}
                  <ResultItem icon={<Award size={18} />} label="Trạng thái" value="Đang hiệu lực (Active)" color="text-emerald-600" />
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] border-2 border-red-100 p-12 text-center shadow-xl">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-800">Không Tìm Thấy Dữ Liệu!</h3>
                <p className="text-slate-500 mt-2 font-medium">Mã hash này chưa từng được cấp bởi hệ thống hoặc đã bị thu hồi.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ResultItem({ icon, label, value, color = "text-slate-800" }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl">{icon}</div>
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-sm font-bold break-all ${color}`}>{value}</p>
      </div>
    </div>
  );
}