import { SlashCommandBuilder } from 'discord.js';
import { getLatestUsersStats, getUsers, updateLeaderboardSnapshot, supabase } from '../utils/supabase.ts';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Shows the current leaderboard for this server');

export async function execute(interaction: any) {
  await interaction.deferReply();

  try {
    // Get all users and their latest stats
    const users = await getUsers();
    const latestStats = await getLatestUsersStats();

    if (!latestStats || latestStats.length === 0) {
      await interaction.editReply('No leaderboard data available yet.');
      return;
    }

    // Update the leaderboard snapshot for this guild
    const timestamp = await updateLeaderboardSnapshot(
      interaction.guildId,
      latestStats,
      users,
    );

    // Get the top 10 players for this guild
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
      .eq('guild_id', interaction.guildId)
      .eq('timestamp', timestamp)
      .order('elo', { ascending: false })
      .limit(10);

    if (leaderboardError) {
      throw leaderboardError;
    }

    // Create the embed description with the leaderboard data
    const baseUrl = Deno.env.get('WEB_APP_URL') || 'http://localhost:3000';
    const leaderboardText = leaderboardData.map((entry: any, index: number) => {
      const nickname = entry.users.user_nicknames[0].nickname;
      const elo = entry.elo;
      const rank = entry.rank;
      return `${index + 1}. **${nickname}** - ${elo} ELO (#${rank})`;
    }).join('\n');

    // Create the embed
    await interaction.editReply({
      content: null,
      embeds: [{
        title: 'Server Leaderboard',
        description: `${leaderboardText}\n\n[View Full Leaderboard](${baseUrl}/leaderboard?guildId=${interaction.guildId})`,
        color: 0x00ff00,
        timestamp: timestamp,
        footer: {
          text: 'Updated every 5 minutes'
        }
      }],
    });
  } catch (error) {
    console.error('Error in leaderboard command:', error);
    await interaction.editReply('An error occurred while fetching the leaderboard.');
  }
} 