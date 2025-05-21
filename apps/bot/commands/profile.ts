import { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { updateOptout, updateNickname, getUser, addUser, deleteUser, getLatestUsersStats } from '@bot/utils/supabase';
import { updatePlayerData } from '@bot/utils/updatePlayerData';
import { cleanNickname, getSteamid64 } from '@bot/utils/helpers';

const OWNER_ID = Deno.env.get("OWNER_DISCORD_ID");

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Manage your profile settings, nickname, and Steam connection')
  .addSubcommand(subcommand =>
    subcommand
      .setName('status')
      .setDescription('Check your current profile status')
      .addUserOption(option =>
        option
          .setName('target')
          .setDescription('Target user to check (admin only)')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('set_nickname')
      .setDescription('Set your base nickname')
      .addStringOption(option =>
        option
          .setName('nickname')
          .setDescription('Your desired nickname')
          .setRequired(true)
          .setMaxLength(32)
      )
      .addUserOption(option =>
        option
          .setName('target')
          .setDescription('Target user to modify (admin only)')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('toggle_elo')
      .setDescription('Toggle whether your nickname should be updated with ELO')
      .addUserOption(option =>
        option
          .setName('target')
          .setDescription('Target user to modify (admin only)')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('link_steam')
      .setDescription('Link your Discord account to your Steam profile')
      .addStringOption((option) =>
        option
          .setName('steam_url')
          .setDescription('The link to your Steam profile')
          .setRequired(true)
      )
      .addUserOption(option =>
        option
          .setName('target')
          .setDescription('Target user to modify (admin only)')
          .setRequired(false)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('unlink_steam')
      .setDescription('Remove your Steam account linkage')
      .addUserOption(option =>
        option
          .setName('target')
          .setDescription('Target user to modify (admin only)')
          .setRequired(false)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const guildid = interaction.guildId;
    
    if (!guildid) {
      await interaction.reply({
        content: 'This command can only be used in a server!',
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('target');
    
    // Check if user is trying to modify another user
    if (targetUser) {
      // Verify admin status - either has ban permissions or is the owner
      const member = await interaction.guild!.members.fetch(interaction.user.id);
      const hasPermission = member.permissions.has('BanMembers') || interaction.user.id === OWNER_ID;
      
      if (!hasPermission) {
        await interaction.reply({
          content: 'You do not have permission to modify other users!',
          ephemeral: true,
        });
        return;
      }
    }

    const discordid = targetUser ? targetUser.id : interaction.user.id;

    if (subcommand === 'status') {
      const user = await getUser(discordid);
      if (!user) {
        await interaction.reply({
          content: targetUser
            ? `${targetUser.username} is not registered in the system.`
            : 'You are not registered in the system. Use /profile link_steam to register.',
          ephemeral: true,
        });
        return;
      }

      // Get latest stats for ELO information
      const latestStats = await getLatestUsersStats();
      const userStats = latestStats?.find(stats => stats.steamid64 === user.steamid64);

      const nickname = user.guildid_to_nickname[guildid] || 'Not set';
      const status = [
        `**Profile Status**`,
        `Base Nickname: ${nickname}`,
        `ELO Updates: ${user.optout ? 'Disabled' : 'Enabled'}`,
        `Steam ID: ${user.steamid64 || 'Not linked'}`,
        `Steam Profile: ${user.steamid64 ? `https://steamcommunity.com/profiles/${user.steamid64}` : 'Not linked'}`,
        userStats ? `Current ELO: ${userStats.elo}` : 'Current ELO: Not available',
        userStats ? `Global Rank: #${userStats.rank}` : 'Global Rank: Not available',
        userStats ? `Win Streak: ${userStats.winstreak}` : 'Win Streak: Not available',
      ].join('\n');

      await interaction.reply({
        content: targetUser
          ? `**Status for ${targetUser.username}**\n${status}`
          : `**Your Status**\n${status}`,
        ephemeral: true,
      });
    } else if (subcommand === 'set_nickname') {
      const nickname = interaction.options.getString('nickname', true);
      const cleanNick = cleanNickname(nickname);
      
      // Set the new nickname
      await updateNickname(discordid, guildid, cleanNick);
      await updatePlayerData(interaction.client);

      await interaction.reply({
        content: targetUser 
          ? `Base nickname for ${targetUser.username} has been set to "${cleanNick}"!`
          : `Your base nickname has been set to "${cleanNick}"!`,
        ephemeral: true,
      });
    } else if (subcommand === 'toggle_elo') {
      const user = await getUser(discordid);
      const currentOptout = user?.optout ?? false;
      await updateOptout(discordid, !currentOptout);
      await updatePlayerData(interaction.client);

      await interaction.reply({
        content: targetUser
          ? currentOptout
            ? `${targetUser.username} has been opted back in to ELO updates!`
            : `${targetUser.username} has been opted out of ELO updates!`
          : currentOptout
            ? "You've been opted back in to ELO updates! Your nickname will now be updated with your ELO."
            : "You've been opted out of ELO updates! Your nickname will no longer be modified with your ELO.",
        ephemeral: true,
      });
    } else if (subcommand === 'link_steam') {
      const steamURL = interaction.options.getString('steam_url');
      const nickname = cleanNickname(targetUser ? targetUser.displayName : interaction.user.displayName);

      const steamid64 = await getSteamid64(steamURL!);
      await interaction.reply({
        content: targetUser
          ? `Request to link Steam for ${targetUser.username} has been received! Their info will be updated shortly.`
          : 'Your request to link your Steam has been received! Your info will be updated shortly.',
        ephemeral: true,
      });
      await addUser(discordid, steamid64, guildid, nickname);
      updatePlayerData(interaction.client);
    } else if (subcommand === 'unlink_steam') {
      await deleteUser(discordid);
      await interaction.reply({
        content: targetUser
          ? `${targetUser.username}'s Steam account has been unlinked! Their nickname will be reset.`
          : 'Your Steam account has been unlinked! Your nickname will be reset.',
        ephemeral: true,
      });
      updatePlayerData(interaction.client);
    }
  } catch (error) {
    console.error('Error in profile command: ', error);
    await interaction.reply({
      content: 'Something went wrong! Ask @liamhi for help.',
      ephemeral: true,
    });
  }
}
