import React, {useState, useEffect} from 'react';
import {ApiConfig} from '../types';
import {Settings, Save, X} from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: ApiConfig;
    onSave: (config: ApiConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
                                                                isOpen,
                                                                onClose,
                                                                config,
                                                                onSave,
                                                            }) => {
    const [host, setHost] = useState(config.host);
    const [path, setPath] = useState(config.path);

    useEffect(() => {
        if (isOpen) {
            setHost(config.host);
            setPath(config.path);
        }
    }, [isOpen, config]);

    if (!isOpen) return null;

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic cleanup: remove trailing slashes from host, ensure leading slash on path
        let cleanHost = host.trim().replace(/\/+$/, '');
        let cleanPath = path.trim();
        if (!cleanPath.startsWith('/')) {
            cleanPath = '/' + cleanPath;
        }

        onSave({host: cleanHost, path: cleanPath});
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden ring-1 ring-zinc-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                    <div className="flex items-center gap-2 text-zinc-800">
                        <Settings className="w-5 h-5"/>
                        <h2 className="font-semibold text-lg">API Configuration</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                        <X className="w-5 h-5"/>
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                            <del>API HOST</del>
                        </label>
                        <del>
                            <input
                                type="text"
                                // required
                                disabled
                                placeholder="https://api.example.com"
                                value={host}
                                onChange={(e) => setHost(e.target.value)}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-zinc-300"
                            />
                            <p className="mt-1 text-xs text-zinc-400">
                                The base URL of your backend service.
                            </p>
                        </del>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                            Endpoint Path
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="/sdap4mysql"
                            value={path}
                            onChange={(e) => setPath(e.target.value)}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-zinc-300"
                        />
                        <p className="mt-1 text-xs text-zinc-400">
                            API 端点路径 (Tip: Use <code>/sdap4mysql/...</code> for proxy)
                        </p>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            <Save className="w-4 h-4"/>
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};