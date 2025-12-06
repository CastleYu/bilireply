export interface ReplyData {
  bvid: string;
  content: string;
  dt: string;
  favorite: number;
  link: string;
  pubdate: string;
  reply: number; // Reply count
  reply_type: string; // "1" for main comment, "2" for reply to comment
  title: string;
  user_id: number;
  user_name: string;
  video_owner_name: string;
}

export interface ApiConfig {
  host: string; // e.g., "https://my-api.com"
  path: string; // e.g., "/v1/replies"
}