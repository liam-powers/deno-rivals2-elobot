export interface User {
  discordid: string;
  guildid_to_nickname: Record<string, string>;
  steamid64: string;
  optout?: boolean;
}

export interface UserStats {
  steamid64: string;
  timestamp: number;
  elo: number;
  rank: number;
  winstreak: string;
}

export interface UserLeaderboardInfo {
  imageURL: string;
  nickname: string;
  elo: number;
  globalRank: number;
  winstreak: string;
  serverRank?: number;
}
