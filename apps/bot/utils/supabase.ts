import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';
import type { User, UserStats, UserNickname } from '../../../packages/interfaces.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export async function addUser(
  discordid: string,
  steamId64: string,
  guildid: string,
  nickname: string,
) {
  if (!guildid) {
    console.error('Received null guildid:', guildid);
    return;
  }

  try {
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        discord_id: discordid,
        steam_id64: steamId64,
        optout: false,
      });

    if (userError) throw userError;

    const { error: nicknameError } = await supabase
      .from('user_nicknames')
      .upsert({
        discord_id: discordid,
        guild_id: guildid,
        nickname: nickname,
      });

    if (nicknameError) throw nicknameError;

    console.log(`addUser(): User with nickname ${nickname} added successfully`);
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        discord_id,
        steam_id64,
        optout,
        user_nicknames (
          guild_id,
          nickname
        )
      `);

    if (error) throw error;

    return users.map((user) => ({
      discordid: user.discord_id,
      steamid64: user.steam_id64,
      optout: user.optout,
      guildid_to_nickname: Object.fromEntries(
        user.user_nicknames.map((n: UserNickname) => [n.guild_id, n.nickname]),
      ),
    }));
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}

export async function getUser(discordid: string): Promise<User | undefined> {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        discord_id,
        steam_id64,
        optout,
        user_nicknames (
          guild_id,
          nickname
        )
      `)
      .eq('discord_id', discordid)
      .single();

    if (error) throw error;
    if (!user) return undefined;

    return {
      discordid: user.discord_id,
      steamid64: user.steam_id64,
      optout: user.optout,
      guildid_to_nickname: Object.fromEntries(
        user.user_nicknames.map((n: UserNickname) => [n.guild_id, n.nickname]),
      ),
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return undefined;
  }
}

// User stats functions
export async function addUserStatsEntries(userStatsData: UserStats[]) {
  try {
    if (userStatsData.length === 0) {
      console.error('addUserStatsEntries(): received empty userStatsData. Returning!');
      return;
    }

    const { error } = await supabase
      .from('user_stats')
      .upsert(
        userStatsData.map((stats) => ({
          steam_id64: stats.steamid64,
          timestamp: stats.timestamp,
          elo: stats.elo,
          rank: stats.rank,
          winstreak: stats.winstreak,
        })),
      );

    if (error) throw error;
  } catch (error) {
    console.error('Error adding user stats:', error);
    throw error;
  }
}

export async function getLatestUsersStats(): Promise<UserStats[] | undefined> {
  try {
    const { data: latestTimestamp, error: timestampError } = await supabase
      .from('user_stats')
      .select('timestamp')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (timestampError?.code === 'PGRST116') {
      console.log('No user stats entries found in the database yet.');
      return undefined;
    }
    if (timestampError) throw timestampError;
    if (!latestTimestamp) return undefined;

    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('timestamp', latestTimestamp.timestamp);

    if (statsError) throw statsError;
    if (!stats || stats.length === 0) {
      console.log('No user stats found for the latest timestamp.');
      return undefined;
    }

    return stats.map((stat) => ({
      steamid64: stat.steam_id64,
      timestamp: stat.timestamp,
      elo: stat.elo,
      rank: stat.rank,
      winstreak: stat.winstreak,
    }));
  } catch (error) {
    console.error('Error getting latest user stats:', error);
    return undefined;
  }
}

export async function updateNickname(
  discordid: string,
  guildid: string,
  nickname: string,
) {
  try {
    const { error } = await supabase
      .from('user_nicknames')
      .upsert({
        discord_id: discordid,
        guild_id: guildid,
        nickname: nickname,
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating nickname:', error);
    throw error;
  }
}

export async function updateOptout(discordid: string, optout: boolean) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ optout })
      .eq('discord_id', discordid);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating optout:', error);
    throw error;
  }
}

export async function deleteUser(discordid: string) {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('discord_id', discordid);

    if (error) throw error;
  } catch (error) {
    console.error('deleteUser() error: ', error);
    throw error;
  }
}

export async function updateLeaderboardSnapshot(
  guildId: string,
  userStats: UserStats[],
  users: User[],
) {
  try {
    const timestamp = new Date().toISOString();
    
    // Create a map of steamid64 to discordid for easy lookup
    const steamToDiscord = new Map(
      users.map(user => [user.steamid64, user.discordid])
    );
    
    const { error } = await supabase
      .from('leaderboard_snapshots')
      .upsert(
        userStats.map((stats) => ({
          discord_id: steamToDiscord.get(stats.steamid64),
          guild_id: guildId,
          timestamp: timestamp,
          elo: stats.elo,
          rank: stats.rank,
        })).filter(entry => entry.discord_id), // Filter out any entries where we couldn't find the discord_id
      );

    if (error) throw error;
    return timestamp;
  } catch (error) {
    console.error('Error updating leaderboard snapshot:', error);
    throw error;
  }
}
