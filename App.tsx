import React, {useState, useEffect, useCallback} from 'react';
import {ApiConfig, ReplyData} from './types';
import {SettingsModal} from './components/SettingsModal';
import {ReplyItem} from './components/ReplyItem';
import {Search, Loader2, AlertCircle, Settings as SettingsIcon, History} from 'lucide-react';

// Default config
const DEFAULT_CONFIG: ApiConfig = {
    host: '',
    path: '',
};

const STORAGE_KEY_CONFIG = 'bili_reply_scout_config';
const STORAGE_KEY_UID = 'bili_reply_scout_last_uid';

const App: React.FC = () => {
    // State
    const [config, setConfig] = useState<ApiConfig>(DEFAULT_CONFIG);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const [uid, setUid] = useState('');
    const [data, setData] = useState<ReplyData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 100; // Fixed as per requirements

    // Load config on mount
    useEffect(() => {
        const savedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
        if (savedConfig) {
            setConfig(JSON.parse(savedConfig));
        } else {
            setIsSettingsOpen(true); // Open settings if no config exists
        }

        const savedUid = localStorage.getItem(STORAGE_KEY_UID);
        if (savedUid) {
            setUid(savedUid);
        }
    }, []);

    const saveConfig = (newConfig: ApiConfig) => {
        setConfig(newConfig);
        localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
    };

    const fetchData = useCallback(async (isLoadMore: boolean = false) => {
        // Only check for path now, as host can be empty for relative paths (Nginx proxy)
        if (!config.path) {
            setError("Please configure the API Path in settings.");
            setIsSettingsOpen(true);
            return;
        }

        if (!uid) {
            setError("Please enter a User ID.");
            return;
        }

        setLoading(true);
        setError(null);
        localStorage.setItem(STORAGE_KEY_UID, uid);

        const currentPage = isLoadMore ? page + 1 : 1;

        try {
            // Construct URL logic to support both absolute and relative paths
            // If host is provided, use it. If not, default to current origin (relative path).
            // 【修改重点】：无论 config.host 是否有值，都强制使用 window.location.origin
            // 这样生成的 URL 会是 http://localhost:3000/sdap4mysql...
            // 从而让本地代理服务器能够捕获到这个请求
            const baseUrl = new URL(config.path, window.location.origin);

            baseUrl.searchParams.append('pageSize', pageSize.toString());
            baseUrl.searchParams.append('pageNum', currentPage.toString());
            baseUrl.searchParams.append('uid', uid);
            const response = await fetch(baseUrl.toString());

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            // 【修改开始】：解析新的响应结构 { code, data, msg }
            const jsonResponse = await response.json();

            // 1. 检查是否存在 data 字段且必须是数组
            if (!jsonResponse || !Array.isArray(jsonResponse.data)) {
                console.error("Unexpected response structure:", jsonResponse);
                // 如果接口返回了 msg 字段，优先抛出该错误信息，否则抛出通用格式错误
                throw new Error(jsonResponse.msg || "Invalid response format: 'data' field is missing or not an array.");
            }

            // 2. 提取真正的列表数据
            const newReplies: ReplyData[] = jsonResponse.data;
            // 【修改结束】

            if (isLoadMore) {
                setData(prev => [...prev, ...newReplies]);
                setPage(currentPage);
            } else {
                setData(newReplies);
                setPage(1);
            }

            // If we got fewer items than page size, we've reached the end
            if (newReplies.length < pageSize) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }, [config, uid, page, pageSize]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setHasMore(true); // Reset hasMore on new search
        fetchData(false);
    };

    const getReplyIdFromLink = (link: string) => {
        try {
            const parts = link.split('#reply');
            if (parts.length > 1) return parts[1];
        } catch (e) {
            // ignore
        }
        return '';
    };

    return (
        <div className="min-h-screen flex flex-col font-sans text-zinc-900">

            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-zinc-200 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

                    {/* Logo / Title */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div
                            className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-zinc-200">
                            B
                        </div>
                        <h1 className="hidden md:block font-bold text-lg tracking-tight">ReplyScout</h1>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex-grow max-w-xl flex items-center gap-2">
                        <div className="relative flex-grow">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-zinc-400"/>
                            </div>
                            <input
                                type="number"
                                value={uid}
                                onChange={(e) => setUid(e.target.value)}
                                placeholder="Enter Bilibili UID..."
                                className="block w-full pl-10 pr-3 py-2 border border-zinc-200 rounded-lg leading-5 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                        >
                            {loading && page === 1 ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Query'}
                        </button>
                    </form>

                    {/* Settings Trigger */}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-all"
                        title="API Settings"
                    >
                        <SettingsIcon className="w-5 h-5"/>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow bg-zinc-50/50">
                <div className="max-w-5xl mx-auto px-4 py-6">

                    {/* Status Messages */}
                    {error && (
                        <div
                            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                            <div>
                                <h3 className="font-semibold text-sm">Query Failed</h3>
                                <p className="text-sm opacity-90">{error}</p>
                                {(!config.path) && (
                                    <button
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="mt-2 text-xs font-semibold underline hover:no-underline"
                                    >
                                        Open Settings to fix configuration
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && data.length === 0 && !error && (
                        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
                            <History className="w-12 h-12 mb-4 opacity-20"/>
                            <p className="text-sm">Enter a UID to search for replies.</p>
                            <p className="text-xs mt-1 text-zinc-300">Results will appear here in high density.</p>
                        </div>
                    )}

                    {/* Results List */}
                    <div className="space-y-3">
                        {data.map((item, index) => {
                            const replyId = getReplyIdFromLink(item.link) || `${index}`;
                            return (
                                <ReplyItem key={`${replyId}-${index}`} data={item}/>
                            );
                        })}
                    </div>

                    {/* Pagination / Load More */}
                    {data.length > 0 && (
                        <div className="mt-8 flex justify-center pb-8">
                            {hasMore ? (
                                <button
                                    onClick={() => fetchData(true)}
                                    disabled={loading}
                                    className="group relative inline-flex items-center justify-center px-8 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                                            Loading...
                                        </>
                                    ) : (
                                        'Load More Replies'
                                    )}
                                </button>
                            ) : (
                                <span className="text-zinc-400 text-xs uppercase tracking-widest font-medium">
                  End of History
                </span>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                config={config}
                onSave={saveConfig}
            />
        </div>
    );
};

export default App;