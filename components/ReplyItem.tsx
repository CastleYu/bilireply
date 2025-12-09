import React from 'react';
import {ReplyData} from '../types';
import {ThumbsUp, MessageSquare, ExternalLink, CornerDownRight, Tv, SquarePlay, Reply} from 'lucide-react';

interface ReplyItemProps {
    data: ReplyData;
}

const BiliIcon = ({className}: { className?: string }) => (
    <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 18 18"
        width="18"
        height="18"
        fill="currentColor"
    >
        <path
            d="M4.612500000000001 6.186037499999999C4.92315 6.186037499999999 5.175000000000001 6.437872500000001 5.175000000000001 6.748537499999999L5.175000000000001 9.580575C5.175000000000001 10.191075000000001 5.66991 10.686 6.280425000000001 10.686C6.8909325 10.686 7.38585 10.191075000000001 7.38585 9.580575L7.38585 6.748537499999999C7.38585 6.437872500000001 7.637700000000001 6.186037499999999 7.94835 6.186037499999999C8.259 6.186037499999999 8.51085 6.437872500000001 8.51085 6.748537499999999L8.51085 9.580575C8.51085 10.8124125 7.512262499999999 11.811 6.280425000000001 11.811C5.048595000000001 11.811 4.050000000000001 10.8124125 4.050000000000001 9.580575L4.050000000000001 6.748537499999999C4.050000000000001 6.4378725000000005 4.3018350000000005 6.186037499999999 4.612500000000001 6.186037499999999z"/>
        <path
            d="M9.48915 6.748537499999999C9.48915 6.437872500000001 9.7409625 6.186037499999999 10.05165 6.186037499999999L11.79375 6.186037499999999C12.984637500000002 6.186037499999999 13.950000000000001 7.151415 13.950000000000001 8.34225C13.950000000000001 9.5331375 12.984637500000002 10.4985 11.79375 10.4985L10.61415 10.4985L10.61415 11.2485C10.61415 11.55915 10.3623 11.811 10.05165 11.811C9.7409625 11.811 9.48915 11.55915 9.48915 11.2485L9.48915 6.748537499999999zM10.61415 9.3735L11.79375 9.3735C12.3633 9.3735 12.825000000000001 8.9118 12.825000000000001 8.34225C12.825000000000001 7.7727375 12.3633 7.31103 11.79375 7.31103L10.61415 7.31103L10.61415 9.3735z"/>
        <path
            d="M9 3.7485375000000003C7.111335 3.7485375000000003 5.46225 3.84462 4.2981675 3.939015C3.4891575 4.0046175 2.8620825 4.6226400000000005 2.79 5.424405C2.7045525 6.37485 2.625 7.6282499999999995 2.625 8.9985C2.625 10.368825000000001 2.7045525 11.622225 2.79 12.5726625C2.8620825 13.374412500000002 3.4891575 13.992450000000002 4.2981675 14.058074999999999C5.46225 14.152425000000001 7.111335 14.2485 9 14.2485C10.888874999999999 14.2485 12.538050000000002 14.152425000000001 13.702200000000001 14.058037500000001C14.511074999999998 13.9924125 15.138000000000002 13.3746 15.210075 12.573037500000002C15.295499999999999 11.622975 15.375 10.3698375 15.375 8.9985C15.375 7.627237500000001 15.295499999999999 6.3740775 15.210075 5.4240375C15.138000000000002 4.622475 14.511074999999998 4.00464 13.702200000000001 3.9390374999999995C12.538050000000002 3.844635 10.888874999999999 3.7485375000000003 9 3.7485375000000003zM4.2072375 2.8176975C5.39424 2.7214425 7.074434999999999 2.6235375000000003 9 2.6235375000000003C10.925775 2.6235375000000003 12.606075 2.7214575 13.793099999999999 2.81772C15.141074999999999 2.92704 16.208849999999998 3.9695849999999995 16.330575 5.323297500000001C16.418174999999998 6.297675 16.5 7.585537500000001 16.5 8.9985C16.5 10.4115375 16.418174999999998 11.6994 16.330575 12.6738C16.208849999999998 14.027474999999999 15.141074999999999 15.0700125 13.793099999999999 15.1793625C12.606075 15.275625 10.925775 15.3735 9 15.3735C7.074434999999999 15.3735 5.39424 15.275625 4.2072375 15.179400000000001C2.859045 15.070049999999998 1.7912325 14.027212500000001 1.6695225000000002 12.673425C1.5818849999999998 11.69865 1.5 10.4106 1.5 8.9985C1.5 7.586475 1.5818849999999998 6.2984025 1.6695225000000002 5.3236725C1.7912325 3.96984 2.859045 2.9270175000000003 4.2072375 2.8176975z"/>
    </svg>
);

export const ReplyItem: React.FC<ReplyItemProps> = ({data}) => {
    // Format date
    const dateStr = data.pubdate || data.dt || '';
    const [datePart, timePart] = dateStr.includes(' ') ? dateStr.split(' ') : [dateStr, ''];

    const isReply = data.reply_type === '2';
    // Check if content starts with "回复" to identify double-nested replies
    const isDoubleReply = data.content.trim().startsWith('回复');

    return (
        <div
            className="group bg-white border border-zinc-200 rounded-md p-3 hover:border-orange-300 hover:shadow-sm transition-all duration-200">

            {/* Mobile Header: Source & UP Info */}
            <div
                className="flex sm:hidden items-center justify-between mb-2 pb-2 border-b border-zinc-100 border-dashed gap-3">
                <a
                    href={data.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-zinc-400 truncate font-mono hover:text-orange-500 flex-1 min-w-0"
                >
                    {data.title}
                </a>

                <div className="flex items-center gap-1 text-zinc-500 flex-shrink-0 max-w-[40%] justify-end">
                    <BiliIcon className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0"/>
                    <span className="text-[10px] font-medium truncate">{data.video_owner_name}</span>
                </div>
            </div>

            <div className="flex gap-3">
                {/* Desktop Left Column: Metadata & Stats */}
                <div className="hidden sm:flex flex-col w-24 text-right flex-shrink-0 pt-1 gap-0.5">
                    <div className="text-xs font-mono text-zinc-500 font-medium">{datePart}</div>
                    <div className="text-[10px] font-mono text-zinc-300">{timePart}</div>

                    <div className="flex justify-end items-center gap-2 mt-2 text-zinc-400">
                        <div className="flex items-center gap-1" title="获赞">
                            <span className="text-xs font-medium">{data.favorite}</span>
                            <ThumbsUp className="w-3 h-3"/>
                        </div>
                        <div className="flex items-center gap-1" title="回复数">
                            <span className="text-xs font-medium">{data.reply}</span>
                            <MessageSquare className="w-3 h-3"/>
                        </div>
                    </div>
                </div>

                {/* Middle Column: Content */}
                <div className="flex-grow min-w-0 flex flex-col gap-1">

                    {/* Desktop Header: Video Context */}
                    <div className="hidden sm:flex items-center gap-2 mb-1">
                        <div
                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-50 border border-zinc-200 max-w-full text-[11px]">

                            <div className="flex items-center gap-1 text-zinc-400 flex-shrink-0">
                                <SquarePlay className="w-3.5 h-3.5"/>
                                <span className="font-mono select-all">
                   {data.bvid}
                 </span>
                            </div>

                            <span className="w-px h-3 bg-zinc-200 flex-shrink-0"></span>

                            <div
                                className="flex items-center gap-1 text-zinc-600 font-medium whitespace-nowrap flex-shrink-0">
                                <BiliIcon className="w-3.5 h-3.5 text-zinc-400"/>
                                <span>{data.video_owner_name}</span>
                            </div>

                            <span className="w-px h-3 bg-zinc-200 flex-shrink-0"></span>

                            <div className="flex items-center gap-1 text-zinc-500 min-w-0">
                                <Tv className="w-3.5 h-3.5 flex-shrink-0"/>
                                <span className="truncate max-w-[280px]" title={data.title}>
                   {data.title}
                 </span>
                            </div>
                        </div>

                        {isDoubleReply ? (
                            <div title="双重楼中楼" className="flex items-center text-indigo-400 ml-1 cursor-help">
                                <Reply className="w-4 h-4"/>
                            </div>
                        ) : isReply && (
                            <div title="楼中楼" className="flex items-center text-orange-400 ml-1 cursor-help">
                                <CornerDownRight className="w-4 h-4"/>
                            </div>
                        )}
                    </div>

                    {/* Content Body */}
                    <div className="relative">
                        <p className="text-sm text-zinc-800 leading-6 whitespace-pre-wrap break-words">
                            {isDoubleReply ? (
                                <span className="sm:hidden inline-block mr-1 text-indigo-400 align-middle">
                                    <Reply className="w-3.5 h-3.5"/>
                                </span>
                            ) : isReply && (
                                <span className="sm:hidden inline-block mr-1 text-orange-400 align-middle">
                                    <CornerDownRight className="w-3.5 h-3.5"/>
                                </span>
                            )}
                            {data.content}
                        </p>
                    </div>

                    {/* Mobile Footer: Stats & Date */}
                    <div
                        className="sm:hidden mt-2 pt-2 border-t border-zinc-100 border-dashed flex items-center justify-between px-1">
                        <div className="flex gap-4 text-zinc-400">
                            <div className="flex items-center gap-1">
                                <ThumbsUp className="w-3 h-3"/>
                                <span className="text-xs">{data.favorite}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3"/>
                                <span className="text-xs">{data.reply}</span>
                            </div>
                        </div>
                        <span className="text-[10px] text-zinc-300 font-mono whitespace-nowrap">
                            {datePart} {timePart}
                        </span>
                    </div>

                </div>

                {/* Desktop Right Column: Link */}
                <div className="hidden sm:flex flex-shrink-0 pt-0.5 items-start">
                    <a
                        href={data.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-orange-50 text-zinc-300 hover:text-orange-500 transition-colors"
                        title="传送门"
                    >
                        <ExternalLink className="w-4 h-4"/>
                    </a>
                </div>

            </div>
        </div>
    );
};
