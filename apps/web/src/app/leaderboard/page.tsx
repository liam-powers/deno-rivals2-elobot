import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
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

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: { guildId?: string; page?: string };
}) {
  const params = await searchParams;
  const guildId = params.guildId;
  const page = parseInt(params.page || '1');
  const itemsPerPage = 10;

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

  // Get the leaderboard data
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
    .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

  if (leaderboardError) {
    console.error('Error fetching leaderboard:', leaderboardError);
    return <div>Error loading leaderboard data</div>;
  }

  // Get Steam avatars for all players
  const steamIds = leaderboardData?.map((entry: LeaderboardEntry) => entry.users.steam_id64) || [];
  const avatarMap = await getSteamAvatars(steamIds);

  // Get total count for pagination
  const { count, error: countError } = await supabase
    .from('leaderboard_snapshots')
    .select('*', { count: 'exact', head: true })
    .eq('guild_id', guildId)
    .eq('timestamp', latestTimestamp.timestamp);

  if (countError) {
    console.error('Error fetching count:', countError);
    return <div>Error loading leaderboard data</div>;
  }

  const totalPages = Math.ceil((count || 0) / itemsPerPage);

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>ELO</TableHead>
                <TableHead>Global Rank</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xl">
              {leaderboardData?.map((entry: LeaderboardEntry, index: number) => (
                <TableRow key={entry.users.steam_id64}>
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Image
                        src={avatarMap[entry.users.steam_id64] || '/default-avatar.png'}
                        alt={`${entry.users.user_nicknames[0].nickname}'s Steam Avatar`}
                        width={64}
                        height={64}
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

          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                {page > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={`/leaderboard?guildId=${guildId}&page=${page - 1}`} />
                  </PaginationItem>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href={`/leaderboard?guildId=${guildId}&page=${p}`}
                      isActive={p === page}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {page < totalPages && (
                  <PaginationItem>
                    <PaginationNext href={`/leaderboard?guildId=${guildId}&page=${page + 1}`} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 