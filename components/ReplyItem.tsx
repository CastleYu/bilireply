import React from 'react';
import { ReplyData } from '../types';
import { ThumbsUp, MessageSquare, ExternalLink, PlayCircle } from 'lucide-react';

interface ReplyItemProps {
  data: ReplyData;
}

export const ReplyItem: React.FC<ReplyItemProps> = ({ data }) => {
  // Format date: "2025-11-28 15:22:59" -> split into date and time
  const [datePart, timePart] = data.pubdate ? data.pubdate.split(' ') : [data.dt, ''];

  return (
      <div className="group relative bg-white border border-zinc-200 rounded-md p-3 hover:border-blue-300 hover:shadow-sm transition-all duration-200">
        <div className="flex items-start gap-3">

          {/* Left Column: Metadata & Stats */}
          <div className="flex-shrink-0 w-24 flex flex-col gap-1 text-right pt-0.5">
          <span className="text-xs font-mono text-zinc-500 whitespace-nowrap overflow-hidden text-ellipsis">
            {datePart}
          </span>
            <span className="text-[10px] font-mono text-zinc-300">
             {timePart}
          </span>

            <div className="mt-2 flex items-center justify-end gap-1 text-zinc-400">
              <span className="text-xs font-medium">{data.favorite}</span>
              <ThumbsUp className="w-3 h-3" />
            </div>
            <div className="flex items-center justify-end gap-1 text-zinc-400">
              <span className="text-xs font-medium">{data.reply}</span>
              <MessageSquare className="w-3 h-3" />
            </div>
          </div>

          {/* Middle Column: Main Content */}
          <div className="flex-grow min-w-0">

            {/* Header Line: User info + Video Info */}
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1.5">
            <span className="text-sm font-bold text-zinc-800">
              {data.user_name}
            </span>

              <div className="flex-grow"></div>

              {/* Video Info Pill (Desktop) */}
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-50 border border-zinc-200 max-w-[70%]">
               <span className="text-[10px] text-zinc-400 font-mono">
                 {data.bvid}
               </span>
                <span className="w-px h-3 bg-zinc-200 flex-shrink-0"></span>
                <span className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">
                 UP: {data.video_owner_name}
               </span>
                <span className="w-px h-3 bg-zinc-200 flex-shrink-0"></span>
                <span className="text-[10px] text-zinc-600 truncate" title={data.title}>
                 {data.title}
               </span>
              </div>
            </div>

            {/* Content */}
            <div className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap break-words font-normal">
              {data.content}
            </div>

            {/* Mobile Video Info */}
            <div className="sm:hidden mt-2 pt-2 border-t border-zinc-50 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                <span className="font-mono">{data.bvid}</span>
                <span>•</span>
                <span>UP: {data.video_owner_name}</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-500">
                <PlayCircle className="w-3 h-3" />
                <span className="text-xs truncate">{data.title}</span>
              </div>
            </div>

          </div>

          {/* Right Column: Actions */}
          <div className="flex-shrink-0 pt-0.5">
            <a
                href={data.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-50 text-zinc-300 hover:text-blue-600 transition-colors"
                title="Open in Bilibili"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
  );
};