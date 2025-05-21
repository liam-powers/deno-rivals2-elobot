import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Image from 'next/image';

// Create a single instance of the Supabase client
const supabase = createClient();

interface LeaderboardEntry {
  users: {
    steam_id64: string;
    user_nicknames: Array<{
      nickname: string;
    }>;
  };
  elo: number;
  rank: number;
}

interface SteamPlayer {
  steamid: string;
  avatarfull: string;
}

// Function to fetch Steam avatars in batch
async function getSteamAvatars(steamIds: string[]): Promise<Record<string, string>> {
  const STEAM_API_KEY = process.env.STEAM_API_KEY;
  if (!STEAM_API_KEY) {
    console.error('STEAM_API_KEY is not defined');
    return {};
  }

  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamIds.join(',')}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Steam API error:', response.status, response.statusText);
      return {};
    }

    const data = await response.json();
    const avatarMap: Record<string, string> = {};
    if (data.response?.players) {
      data.response.players.forEach((player: SteamPlayer) => {
        avatarMap[player.steamid] = player.avatarfull;
      });
    }
    return avatarMap;
  } catch (error) {
    console.error('Error fetching Steam avatars:', error);
    return {};
  }
}

function getNameColor(elo: number): string {
  return elo >= 1500 // master
    ? '#b6f6c4'
    : elo >= 1300 // diamond
    ? '#baeef2'
    : elo >= 1100 // platinum
    ? '#9b93ef'
    : elo >= 900 // gold
    ? '#fdd257'
    : elo >= 700 // silver
    ? '#e7e5f1'
    : elo >= 500 // bronze
    ? '#b87929'
    : '#7f7866'; // stone
}

export default async function EmbedLeaderboardPage({
  searchParams,
}: {
  searchParams: { guildId?: string };
}) {
  const guildId = searchParams.guildId;

  if (!guildId) {
    return <div>No guild ID provided</div>;
  }

  // Get the latest timestamp for this guild
  const { data: latestTimestamp, error: timestampError } = await supabase
    .from('leaderboard_snapshots')
    .select('timestamp')
    .eq('guild_id', guildId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (timestampError) {
    console.error('Error fetching timestamp:', timestampError);
    return <div>Error loading leaderboard data</div>;
  }

  if (!latestTimestamp) {
    return <div>No leaderboard data available for this guild</div>;
  }

  // Get the leaderboard data - only top 10 for embed
  const { data: leaderboardData, error: leaderboardError } = await supabase
    .from('leaderboard_snapshots')
    .select(`
      *,
      users!inner (
        steam_id64,
        user_nicknames!inner (
          nickname
        )
      )
    `)
    .eq('guild_id', guildId)
    .eq('timestamp', latestTimestamp.timestamp)
    .order('elo', { ascending: false })
    .limit(10);

  if (leaderboardError) {
    console.error('Error fetching leaderboard:', leaderboardError);
    return <div>Error loading leaderboard data</div>;
  }

  // Get Steam avatars for all players
  const steamIds = leaderboardData?.map((entry: LeaderboardEntry) => entry.users.steam_id64) || [];
  const avatarMap = await getSteamAvatars(steamIds);

  const leaderboardText = leaderboardData.map((entry: LeaderboardEntry, index: number) => {
    const nickname = entry.users.user_nicknames[0].nickname;
    const elo = entry.elo;
    const rank = entry.rank;
    return `${index + 1}. **${nickname}** - ${elo} ELO (#${rank})`;
  }).join('\n');

  return (
    <div className="w-[800px] bg-background">
      <Card className="border-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="w-[80px] text-lg">Rank</TableHead>
                <TableHead className="text-lg">Player</TableHead>
                <TableHead className="text-lg">ELO</TableHead>
                <TableHead className="text-lg">Global Rank</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xl">
              {leaderboardData?.map((entry: LeaderboardEntry, index: number) => (
                <TableRow key={entry.users.steam_id64} className="border-b border-border">
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Image
                        src={avatarMap[entry.users.steam_id64] || '/default-avatar.png'}
                        alt={`${entry.users.user_nicknames[0].nickname}'s Steam Avatar`}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <span style={{ color: getNameColor(entry.elo) }}>
                        {entry.users.user_nicknames[0].nickname}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{entry.elo}</TableCell>
                  <TableCell>#{entry.rank}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}