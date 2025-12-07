import React, {useState, useEffect, useCallback} from 'react';
import {ApiConfig, ReplyData} from './types';
import {SettingsModal} from './components/SettingsModal';
import {ReplyItem} from './components/ReplyItem';
import {Search, Loader2, AlertCircle, Settings as SettingsIcon, Utensils, ChefHat, Scroll, Coffee} from 'lucide-react';

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
    const [userName, setUserName] = useState<string>(''); // Extracted from first result
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination State
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const pageSize = 50;

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
        if (!config.path) {
            setError("请先在设置中配置API路径");
            setIsSettingsOpen(true);
            return;
        }

        if (!uid) {
            setError("请输入取餐号 (UID)");
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
            // 此处涉及部署环境，禁止修改
            const baseUrl = new URL(config.path, window.location.origin);

            baseUrl.searchParams.append('pageSize', pageSize.toString());
            baseUrl.searchParams.append('pageNum', currentPage.toString());
            baseUrl.searchParams.append('uid', uid);

            console.log(`[BiliScout] Requesting: ${baseUrl.toString()}`);

            const response = await fetch(baseUrl.toString());
            const responseText = await response.text();

            // 1. Check for HTML response (proxy/path error)
            if (responseText.trim().startsWith('<')) {
                const isDoctype = responseText.includes('<!DOCTYPE') || responseText.includes('<html');
                const errorDetail = isDoctype
                    ? `检测到返回的是网页 (HTML) 而非数据。`
                    : `返回内容疑似非JSON格式。`;

                throw new Error(
                    `${errorDetail}\n` +
                    `通常是因为 "Endpoint Path" 配置不正确，导致请求未经过代理。\n` +
                    `当前请求路径: ${baseUrl.pathname}\n` +
                    `请检查设置 (提示: 路径通常应以 /sdap4mysql 开头)`
                );
            }

            // 2. Check HTTP status
            if (!response.ok) {
                throw new Error(`后厨出错了: ${response.status} ${response.statusText}\n${responseText.slice(0, 100)}`);
            }

            // 3. Parse JSON
            let jsonResponse;
            try {
                jsonResponse = JSON.parse(responseText);
            } catch (e) {
                throw new Error(`JSON解析失败: ${e instanceof Error ? e.message : String(e)}\n返回内容开头: ${responseText.slice(0, 100)}`);
            }

            // Validate response structure { code, data, msg }
            if (!jsonResponse || !Array.isArray(jsonResponse.data)) {
                console.error("Unexpected response structure:", jsonResponse);
                throw new Error(jsonResponse?.msg || `上菜格式不对：找不到数据列表 (code: ${jsonResponse?.code})`);
            }

            const newReplies: ReplyData[] = jsonResponse.data;

            // Extract Username from the first available item if not already set or if it's a new search
            if (!isLoadMore && newReplies.length > 0) {
                setUserName(newReplies[0].user_name);
            } else if (!isLoadMore && newReplies.length === 0) {
                setUserName('');
            }

            if (isLoadMore) {
                setData(prev => [...prev, ...newReplies]);
                setPage(currentPage);
            } else {
                setData(newReplies);
                setPage(1);
            }

            // Check if we've reached the end
            if (newReplies.length < pageSize) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "发生未知错误");
        } finally {
            setLoading(false);
        }
    }, [config, uid, page, pageSize]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setHasMore(true);
        setUserName(''); // Reset name on new search
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
        <div className="min-h-screen flex flex-col font-sans text-zinc-900 bg-zinc-50">

            {/* Main Header */}
            <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-sm">
                <div
                    className="max-w-5xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">

                    {/* Logo */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-orange-100">
                            <Utensils className="w-4 h-4 sm:w-5 sm:h-5"/>
                        </div>
                        <h1 className="hidden sm:block font-bold text-lg tracking-tight text-zinc-800">Bili食堂</h1>
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
                                placeholder="请输入取餐号 (UID)..."
                                className="block w-full pl-9 pr-3 py-1.5 sm:py-2 border border-zinc-200 rounded-lg leading-5 bg-zinc-50 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-mono"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 sm:py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm whitespace-nowrap"
                        >
                            {loading && page === 1 ? <Loader2 className="w-4 h-4 animate-spin"/> : '取餐'}
                        </button>
                    </form>

                    {/* Settings */}
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-all"
                    >
                        <SettingsIcon className="w-5 h-5"/>
                    </button>
                </div>
            </header>

            {/* Sticky User Info Sub-header */}
            {userName && (
                <div
                    className="sticky top-14 sm:top-16 z-30 bg-orange-50/95 backdrop-blur-sm border-b border-orange-100 shadow-sm animate-in fade-in slide-in-from-top-1">
                    <div
                        className="max-w-5xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between text-xs sm:text-sm text-orange-900">
                        <div className="flex items-center gap-2">
                            <ChefHat className="w-4 h-4 text-orange-500"/>
                            <span className="opacity-70">用户 </span>
                            <span className="font-bold text-base">{userName}</span>
                        </div>
                        <div className="flex items-center gap-2 font-mono opacity-60">
                            <span>UID: {uid}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-grow">
                <div className="max-w-5xl mx-auto px-2 sm:px-4 py-4 sm:py-6">

                    {/* Status Messages */}
                    {error && (
                        <div
                            className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700 shadow-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600"/>
                            <div className="flex-grow min-w-0">
                                <h3 className="font-semibold text-sm text-red-800">出餐失败</h3>
                                <p className="text-sm opacity-90 mt-1 whitespace-pre-wrap break-words font-mono text-xs">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && data.length === 0 && !error && (
                        <div className="py-24 flex flex-col items-center justify-center text-zinc-300">
                            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                                <Coffee className="w-10 h-10 text-zinc-300"/>
                            </div>
                            <p className="text-sm font-medium text-zinc-400">请输入取餐号 (UID) </p>
                            <p className="text-xs mt-2 text-zinc-300">即点即食</p>
                        </div>
                    )}

                    {/* Results List */}
                    <div className="space-y-2 sm:space-y-3">
                        {data.map((item, index) => {
                            // Unique key generation
                            const replyId = getReplyIdFromLink(item.link) || `${index}`;
                            return (
                                <ReplyItem key={`${item.bvid}-${replyId}-${index}`} data={item}/>
                            );
                        })}
                    </div>

                    {/* Pagination / Load More */}
                    {data.length > 0 && (
                        <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center pb-12 gap-2">
                            {hasMore ? (
                                <button
                                    onClick={() => fetchData(true)}
                                    disabled={loading}
                                    className="group relative inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-orange-600 bg-white border border-orange-200 rounded-full hover:bg-orange-50 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin"/>
                                            正在烹饪...
                                        </>
                                    ) : (
                                        <>
                                            <Scroll className="w-4 h-4 mr-2"/>
                                            加餐
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 text-zinc-300 py-2">
                                    <div className="h-px w-12 bg-zinc-200"></div>
                                    <span className="text-xs uppercase tracking-widest font-medium">
                                        已取餐
                                    </span>
                                    <div className="h-px w-12 bg-zinc-200"></div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

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