'use client';

import { useState, useEffect, useMemo } from 'react'; // Đã thêm useMemo ở đây
import { useWeb3Store } from '@/store/useWeb3Store';
import { toast } from 'sonner';
import {
  GraduationCap,
  UserPlus,
  ArrowUpRight,
  Fingerprint,
  Users,
  Award,
  Clock,
  LayoutGrid,
  Wallet,
  Copy,
  Loader2,
} from 'lucide-react';

import {
  DiplomaData,
  generateDiplomaHash,
} from '@/types/diploma';

interface RealActivity {
  id: string;
  title: string;
  time: string;
  status: 'Success' | 'Pending';
  hash?: string;
}

export default function IssuerPage() {
  const { account, contract, connectWallet, isConnected } = useWeb3Store();
  const [activeTab, setActiveTab] = useState<'register' | 'issue'>('register');
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalDiplomas: 0,
  });

  const [activities, setActivities] = useState<RealActivity[]>([]);

  // FORM STATES
  const [studentWalletReg, setStudentWalletReg] = useState('');
  const [studentCodeReg, setStudentCodeReg] = useState('');
  const [receiverWallet, setReceiverWallet] = useState('');
  const [diplomaInfo, setDiplomaInfo] = useState<DiplomaData>({
    fullName: '',
    dateOfBirth: '',
    gender: 'Nam',
    studentId: '',
    course: '',
    major: '',
    ranking: 'Khá',
    issueDate: new Date().toISOString().split('T')[0],
  });

  // 🔥 TỐI ƯU HÓA: Chỉ tính toán lại mã hash khi dữ liệu diplomaInfo thực sự thay đổi
  const currentDiplomaHash = useMemo(() => {
    return generateDiplomaHash(diplomaInfo);
  }, [diplomaInfo]);

  const handleConnect = async () => {
    try {
      await connectWallet();
      toast.success('Đã kết nối ví thành công!');
    } catch {
      toast.error('Kết nối ví thất bại!');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép mã Hash!');
  };

  const fetchOnChainData = async () => {
    if (!contract) return;
    try {
      const sCount = (await contract.studentCount?.()) || 0;
      const dCount = (await contract.diplomaCount?.()) || 0;

      setStats({
        totalStudents: Number(sCount),
        totalDiplomas: Number(dCount),
      });
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    fetchOnChainData();
  }, [contract]);

  const addActivity = (title: string, hash?: string) => {
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    setActivities((prev: any) => [
      {
        id: Date.now().toString(),
        title,
        time: timeStr,
        status: 'Success',
        hash,
      },
      ...prev,
    ].slice(0, 5));
  };

  // LOGIC GHI DANH SINH VIÊN (CHẶN TRÙNG LẶP)
  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contract) return toast.error('Vui lòng kết nối ví!');
    if (!studentWalletReg.trim() || !studentCodeReg.trim()) {
      return toast.error('Vui lòng nhập đầy đủ thông tin ví và mã sinh viên!');
    }

    setLoading(true);

    try {
      // 1. Kiểm tra trùng lặp ĐỊA CHỈ VÍ sinh viên đã tồn tại
      const studentOnChain = await contract.students(studentWalletReg.trim());
      if (studentOnChain && studentOnChain.exists) {
        setLoading(false);
        return toast.error('Địa chỉ ví này đã được đăng ký cho một sinh viên khác!');
      }

      // 2. Kiểm tra trùng lặp MÃ SINH VIÊN
      if (typeof contract.studentCodeToWallet === 'function') {
        const existingWallet = await contract.studentCodeToWallet(studentCodeReg.trim());
        if (existingWallet && existingWallet !== '0x0000000000000000000000000000000000000000') {
          setLoading(false);
          return toast.error(`Mã sinh viên ${studentCodeReg} đã được liên kết với một ví khác!`);
        }
      }

      // 3. Tiến hành gửi giao dịch nếu tất cả điều kiện hợp lệ
      const tx = await contract.registerStudent(
        studentWalletReg.trim(),
        studentCodeReg.trim()
      );

      await tx.wait();

      addActivity(`Ghi danh SV: ${studentCodeReg}`);
      setStudentWalletReg('');
      setStudentCodeReg('');
      await fetchOnChainData();

      toast.success('Ghi danh thành công!');
    } catch (error: any) {
      console.error(error);
      const reason = error.reason || error.message || '';
      if (reason.includes('already registered') || reason.includes('exists')) {
        toast.error('Lỗi: Sinh viên hoặc mã số này đã tồn tại trên hệ thống!');
      } else {
        toast.error('Lỗi khi ghi danh hoặc giao dịch bị từ chối!');
      }
    } finally {
      setLoading(false);
    }
  };

  // CẤP BẰNG
  const handleIssueDiploma = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contract || !account) return toast.error('Vui lòng kết nối ví!');
    if (!receiverWallet) return toast.error('Vui lòng nhập địa chỉ ví nhận!');

    setLoading(true);

    try {
      // Sử dụng giá trị đã memoized ở đây để tối ưu hiệu năng và tính nhất quán
      const diplomaHash = currentDiplomaHash;

      const studentOnChain = await contract.students(receiverWallet);

      if (!studentOnChain || !studentOnChain.exists) {
        toast.error('Sinh viên chưa được ghi danh trên hệ thống!');
        setLoading(false);
        return;
      }

      // Kiểm tra xem bằng cấp này đã được đúc (mint) trước đó chưa
      if (typeof contract.diplomas === 'function') {
        const diplomaOnChain = await contract.diplomas(diplomaHash);
        if (diplomaOnChain && diplomaOnChain.isIssued) {
          setLoading(false);
          return toast.error('Bằng cấp với thông tin này đã được phát hành trước đó!');
        }
      }

      const tx = await contract.issueDiploma(diplomaHash, receiverWallet);
      const receipt = await tx.wait();

      const event = receipt.events?.find((e: any) => e.event === 'DiplomaIssued');
      const finalHash = event ? event.args.diplomaHash : diplomaHash;

      addActivity(`Cấp bằng cho: ${diplomaInfo.fullName}`, finalHash);

      toast.success(`Cấp bằng thành công! Mã tra cứu: ${finalHash.slice(0, 10)}...`, {
        action: {
          label: "Sao chép mã",
          onClick: () => {
            navigator.clipboard.writeText(finalHash);
            toast.success("Đã sao chép mã tra cứu!");
          }
        }
      });
    } catch (error: any) {
      toast.error(error.reason || 'Lỗi khi phát hành bằng!');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDiplomaInfo((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-900 font-sans">
      {/* NAVBAR */}
      <nav className="h-20 bg-white/70 backdrop-blur-xl border-b border-white sticky top-0 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <GraduationCap size={26} />
          </div>
          <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
            EDU.ISSUER
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'register' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'
                }`}
            >
              GHI DANH SV
            </button>
            <button
              onClick={() => setActiveTab('issue')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'issue' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'
                }`}
            >
              CẤP BẰNG
            </button>
          </div>

          {isConnected ? (
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-xs font-mono font-bold text-slate-600">
                {`${account?.slice(0, 6)}...${account?.slice(-4)}`}
              </span>
            </div>
          ) : (
            <button
              onClick={handleConnect}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
            >
              <Wallet size={14} />
              KẾT NỐI VÍ
            </button>
          )}
        </div>
      </nav>

      {/* MAIN */}
      <main className="p-8 max-w-7xl mx-auto w-full">
        <div className="mb-12 text-left">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Cổng Cấp Phát Bằng Cấp</h2>
          <p className="text-slate-500 mt-2 font-medium">Hệ thống quản lý dữ liệu học thuật phi tập trung.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT FORM */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-[2.5rem] p-10 border border-white shadow-2xl shadow-slate-200/50 relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50" />
              <div className="relative z-10">
                {activeTab === 'register' ? (
                  <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl">
                        <UserPlus size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">Đăng ký Sinh viên</h3>
                        <p className="text-sm text-slate-400">Khởi tạo danh tính SV trên Blockchain</p>
                      </div>
                    </div>

                    <form onSubmit={handleRegisterStudent} className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                          Wallet Address
                        </label>
                        <input
                          value={studentWalletReg}
                          onChange={(e) => setStudentWalletReg(e.target.value)}
                          placeholder="0x..."
                          className="w-full mt-2 p-5 bg-slate-50 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                          Mã số Sinh viên
                        </label>
                        <input
                          value={studentCodeReg ?? ''}
                          onChange={(e) => setStudentCodeReg(e.target.value)}
                          placeholder="B20DCCN..."
                          className="w-full mt-2 p-5 bg-slate-50 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-bold"
                        />
                      </div>

                      <button
                        disabled={loading || !isConnected}
                        className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50"
                      >
                        {loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN GHI DANH'}
                      </button>
                    </form>
                  </section>
                ) : (
                  <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="p-4 bg-teal-50 text-teal-600 rounded-3xl">
                        <Fingerprint size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">Phát hành Bằng cấp</h3>
                        <p className="text-sm text-slate-400">Đúc dữ liệu bằng cấp thành mã Hash</p>
                      </div>
                    </div>

                    <form onSubmit={handleIssueDiploma} className="space-y-4">
                      <div className="p-5 bg-emerald-50 rounded-[1.5rem]">
                        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                          Ví nhận bằng
                        </label>
                        <input
                          value={receiverWallet}
                          onChange={(e) => setReceiverWallet(e.target.value)}
                          placeholder="0x..."
                          className="w-full mt-2 bg-transparent outline-none font-mono text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <input
                          name="fullName"
                          onChange={handleInputChange}
                          placeholder="Họ tên"
                          className="p-4 bg-slate-50 rounded-2xl outline-none"
                        />
                        <input
                          type="date"
                          name="dateOfBirth"
                          onChange={handleInputChange}
                          className="p-4 bg-slate-50 rounded-2xl outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <select name="gender" onChange={handleInputChange} className="p-4 bg-slate-50 rounded-2xl outline-none">
                          <option>Nam</option>
                          <option>Nữ</option>
                        </select>
                        <input
                          name="course"
                          onChange={handleInputChange}
                          placeholder="2020-2024"
                          className="p-4 bg-slate-50 rounded-2xl outline-none"
                        />
                        <select name="ranking" onChange={handleInputChange} className="p-4 bg-slate-50 rounded-2xl outline-none">
                          <option>Xuất sắc</option>
                          <option>Giỏi</option>
                          <option>Khá</option>
                        </select>
                      </div>


                      <div className="bg-slate-900 p-4 rounded-2xl">
                        <div className="flex justify-between mb-2">
                          <span className="text-[10px] text-emerald-400 font-bold uppercase">Digital Fingerprint</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(currentDiplomaHash)} // Đã đổi sang currentDiplomaHash
                          >
                            <Copy size={14} className="text-emerald-400" />
                          </button>
                        </div>
                        <p className="text-[11px] text-emerald-100/70 break-all font-mono">
                          {currentDiplomaHash} {/* Đã đổi sang currentDiplomaHash */}
                        </p>
                      </div>

                      <button
                        disabled={loading || !isConnected}
                        className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-sm tracking-widest hover:bg-slate-900 transition-all disabled:opacity-50"
                      >
                        {loading ? (
                          <div className="flex justify-center items-center gap-2">
                            <Loader2 className="animate-spin" size={16} />
                            ĐANG ĐÚC BẰNG...
                          </div>
                        ) : (
                          'MINT DIPLOMA ON-CHAIN'
                        )}
                      </button>
                    </form>
                  </section>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-5 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm">
                <Users className="text-emerald-500 mb-4" />
                <h4 className="text-2xl font-black">{stats.totalStudents}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase">SV đã ghi danh</p>
              </div>

              <div className="bg-white p-6 rounded-[2rem] shadow-sm">
                <Award className="text-teal-500 mb-4" />
                <h4 className="text-2xl font-black">{stats.totalDiplomas}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Bằng đã cấp</p>
              </div>
            </div>

            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
              <div className="flex justify-between mb-8">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Clock size={18} className="text-emerald-400" />
                  Hoạt động mới
                </h3>
                <LayoutGrid size={18} className="text-slate-500" />
              </div>

              <div className="space-y-6">
                {activities.length > 0 ? (
                  activities.map((act) => (
                    <ActivityItem
                      key={act.id}
                      title={act.title}
                      time={act.time}
                      status={act.status}
                      onCopy={() => act.hash && copyToClipboard(act.hash)}
                      hasHash={!!act.hash}
                    />
                  ))
                ) : (
                  <p className="text-slate-500 text-sm italic">Chưa có hoạt động nào</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ActivityItem({ title, time, status, onCopy, hasHash }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${status === 'Success' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
        <div>
          <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{title}</p>
          <p className="text-[10px] text-slate-500">{time}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {hasHash && (
          <button
            onClick={onCopy}
            className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded-md text-emerald-400 transition-all"
          >
            <Copy size={12} />
          </button>
        )}
        <ArrowUpRight size={14} className="text-slate-600 group-hover:text-emerald-400 transition-all" />
      </div>
    </div>
  );
}