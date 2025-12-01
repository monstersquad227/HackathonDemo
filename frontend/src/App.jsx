import { useState } from 'react'
import { Wallet, LogOut, Plus, CheckCircle } from 'lucide-react';
import './index.css'

function App() {
    const [page, setPage] = useState('activities');
    const [account, setAccount] = useState(null);
    const [activities, setActivities] = useState([
        { id: 1, name: 'Web3 Hackathon 2025', status: 'ongoing', participants: 45, maxParticipants: 100, startTime: '2025-01-20', endTime: '2025-01-22' },
        { id: 2, name: 'DeFi Challenge', status: 'ongoing', participants: 32, maxParticipants: 50, startTime: '2025-02-01', endTime: '2025-02-03' }
    ]);
    const [registrations, setRegistrations] = useState([]);
    const [checkIns, setCheckIns] = useState([]);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const connectWallet = async () => {
        try {
            setLoading(true);
            const mockAddress = '0x' + Math.random().toString(16).slice(2, 42);
            setAccount(mockAddress);
            setMessage('钱包连接成功！');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('连接失败: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const disconnectWallet = () => {
        setAccount(null);
        setFormData({ name: '', email: '', phone: '' });
        setSelectedActivity(null);
    };

    const handleRegister = async () => {
        if (!account || !selectedActivity || !formData.name || !formData.email) {
            setMessage('请完善信息');
            return;
        }

        try {
            setLoading(true);
            setMessage('正在铸造NFT...');

            // 模拟后端调用
            await new Promise(r => setTimeout(r, 2000));

            const mockTokenId = Math.floor(Math.random() * 10000);
            const registration = {
                id: Date.now(),
                activityId: selectedActivity.id,
                activityName: selectedActivity.name,
                walletAddress: account,
                nftTokenId: mockTokenId,
                userName: formData.name,
                email: formData.email,
                registrationTime: new Date().toLocaleString(),
                status: 'minted'
            };

            setRegistrations([...registrations, registration]);
            setFormData({ name: '', email: '', phone: '' });
            setSelectedActivity(null);
            setMessage('报名成功！NFT已发送至你的钱包');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('报名失败: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async (registration) => {
        try {
            setLoading(true);
            setMessage('正在验证NFT...');

            await new Promise(r => setTimeout(r, 1500));

            const checkIn = {
                id: Date.now(),
                activityId: registration.activityId,
                activityName: registration.activityName,
                nftTokenId: registration.nftTokenId,
                checkInTime: new Date().toLocaleString(),
                verificationStatus: 'verified'
            };

            setCheckIns([...checkIns, checkIn]);
            setMessage('打卡成功！');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('打卡失败: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const userRegistrations = registrations.filter(r => r.walletAddress === account);
    const userCheckIns = checkIns.filter(c => userRegistrations.some(r => r.id === c.checkInTime));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <header className="bg-slate-950 border-b border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Hackathon平台</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {account ? (
                            <>
                                <span className="text-cyan-400 font-mono text-sm">{account.slice(0, 6)}...{account.slice(-4)}</span>
                                <button onClick={disconnectWallet} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2">
                                    <LogOut className="w-4 h-4" />
                                    断开
                                </button>
                            </>
                        ) : (
                            <button onClick={connectWallet} disabled={loading} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium transition disabled:opacity-50">
                                连接钱包
                            </button>
                        )}
                    </div>
                </div>
            </header >

            {/* Message Toast */}
            {message && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-40">
                    {message}
                </div>
            )}

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Navigation Tabs */}
                <div className="flex gap-4 mb-8 border-b border-slate-700">
                    <button
                        onClick={() => setPage('activities')}
                        className={`px-4 py-3 font-medium transition border-b-2 ${page === 'activities'
                            ? 'border-cyan-500 text-cyan-400'
                            : 'border-transparent text-slate-400 hover:text-slate-300'
                            }`}
                    >
                        活动列表
                    </button>
                    {account && (
                        <>
                            <button
                                onClick={() => setPage('register')}
                                className={`px-4 py-3 font-medium transition border-b-2 ${page === 'register'
                                    ? 'border-cyan-500 text-cyan-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-300'
                                    }`}
                            >
                                我的报名
                            </button>
                            <button
                                onClick={() => setPage('checkin')}
                                className={`px-4 py-3 font-medium transition border-b-2 ${page === 'checkin'
                                    ? 'border-cyan-500 text-cyan-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-300'
                                    }`}
                            >
                                打卡记录
                            </button>
                        </>
                    )}
                </div>

                {/* Activities Page */}
                {page === 'activities' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {activities.map(activity => (
                            <div key={activity.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-cyan-500 transition">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-2">{activity.name}</h3>
                                        <p className="text-slate-400 text-sm">{activity.startTime} - {activity.endTime}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${activity.status === 'ongoing'
                                        ? 'bg-green-900 text-green-200'
                                        : 'bg-slate-700 text-slate-300'
                                        }`}>
                                        {activity.status === 'ongoing' ? '进行中' : '已结束'}
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-slate-400">报名人数</span>
                                        <span className="text-cyan-400">{activity.participants}/{activity.maxParticipants}</span>
                                    </div>
                                    <div className="w-full bg-slate-700 rounded-full h-2">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition"
                                            style={{ width: `${(activity.participants / activity.maxParticipants) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {account && !registrations.some(r => r.activityId === activity.id) && (
                                    <button
                                        onClick={() => {
                                            setSelectedActivity(activity);
                                            setPage('register');
                                        }}
                                        className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        报名参加
                                    </button>
                                )}
                                {registrations.some(r => r.activityId === activity.id) && (
                                    <div className="w-full px-4 py-2 bg-green-900 text-green-200 rounded-lg font-medium flex items-center justify-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        已报名
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Register Page */}
                {page === 'register' && account && (
                    <div className="max-w-md mx-auto">
                        {selectedActivity ? (
                            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">报名 {selectedActivity.name}</h2>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">姓名</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                            placeholder="输入你的姓名"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">邮箱</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                            placeholder="输入你的邮箱"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">联系方式</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                                            placeholder="输入你的电话"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleRegister}
                                    disabled={loading}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium transition disabled:opacity-50"
                                >
                                    {loading ? '处理中...' : '提交报名（铸造NFT）'}
                                </button>
                            </div>
                        ) : (
                            <p className="text-slate-400 text-center">请从活动列表中选择要报名的活动</p>
                        )}
                    </div>
                )}

                {/* My Registrations */}
                {page === 'register' && account && !selectedActivity && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-white mb-6">我的报名</h2>
                        {userRegistrations.length === 0 ? (
                            <p className="text-slate-400 text-center py-8">暂无报名记录</p>
                        ) : (
                            userRegistrations.map(reg => (
                                <div key={reg.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{reg.activityName}</h3>
                                            <p className="text-slate-400 text-sm">{reg.registrationTime}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-green-900 text-green-200 rounded-full text-xs font-medium">NFT已发放</span>
                                    </div>
                                    <div className="bg-slate-700 rounded p-4 mb-4">
                                        <p className="text-slate-400 text-sm">Token ID: <span className="text-cyan-400 font-mono">{reg.nftTokenId}</span></p>
                                        <p className="text-slate-400 text-sm">报名人: {reg.userName}</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setSelectedActivity({ id: reg.activityId, name: reg.activityName });
                                            setPage('checkin');
                                        }}
                                        className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition"
                                    >
                                        开始打卡
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Check-in Page */}
                {page === 'checkin' && account && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white">打卡验证</h2>

                        {userRegistrations.length === 0 ? (
                            <p className="text-slate-400 text-center py-8">请先报名活动</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {userRegistrations.map(reg => (
                                    <div key={reg.id} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                                        <h3 className="text-lg font-bold text-white mb-4">{reg.activityName}</h3>
                                        <div className="bg-slate-700 rounded p-4 mb-4">
                                            <p className="text-slate-400 text-sm">NFT Token ID</p>
                                            <p className="text-cyan-400 font-mono font-bold text-lg">{reg.nftTokenId}</p>
                                        </div>
                                        <button
                                            onClick={() => handleCheckIn(reg)}
                                            disabled={loading}
                                            className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            {loading ? '验证中...' : '验证NFT打卡'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {checkIns.length > 0 && (
                            <div className="mt-8">
                                <h3 className="text-xl font-bold text-white mb-4">打卡记录</h3>
                                <div className="space-y-3">
                                    {checkIns.map(c => (
                                        <div key={c.id} className="bg-green-900 border border-green-700 rounded-lg p-4 flex items-start gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-green-200 font-medium">{c.activityName}</p>
                                                <p className="text-green-300 text-sm">{c.checkInTime}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div >
    )
}

export default App
