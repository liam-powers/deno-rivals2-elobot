import { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { cleanNickname, getSteamid64 } from '@bot/utils/helpers';
import { addUser, deleteUser } from '@bot/utils/supabase';
import { updatePlayerData } from '@bot/utils/updatePlayerData';

export const data = new SlashCommandBuilder()
  .setName('manage_steam')
  .setDescription('Manage your Steam account linkage')
  .addSubcommand(subcommand =>
    subcommand
      .setName('link')
      .setDescription('Link your Discord account to your Steam profile!')
      .addStringOption((option) =>
        option
          .setName('steam_url')
          .setDescription('The link to your Steam profile')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('unlink')
      .setDescription('Remove your Steam account linkage')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const discordid = interaction.user.id;
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'link') {
      const steamURL = interaction.options.getString('steam_url');
      const nickname = cleanNickname(interaction.user.displayName);
      const guildid = interaction.guildId;

      const steamid64 = await getSteamid64(steamURL!);
      await interaction.reply({
        content:
          'Your request to link your Steam has been received! Your info will be updated shortly.',
        ephemeral: true,
      });
      await addUser(discordid, steamid64, guildid!, nickname);
      updatePlayerData(interaction.client);
    } else if (subcommand === 'unlink') {
      await deleteUser(discordid);
      await interaction.reply({
        content: 'Your Steam account has been unlinked! Your nickname will be reset.',
        ephemeral: true,
      });
      updatePlayerData(interaction.client);
    }
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content:
        'Something went wrong! Make sure to provide a valid Steam URL when linking, or try again later.',
      ephemeral: true,
    });
  }
}
