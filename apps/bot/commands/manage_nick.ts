import { ChatInputCommandInteraction } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { updateOptout, updateNickname, getUser } from '@bot/utils/supabase';
import { updatePlayerData } from '@bot/utils/updatePlayerData';
import { cleanNickname } from '@bot/utils/helpers';

export const data = new SlashCommandBuilder()
  .setName('manage_nick')
  .setDescription('Manage your nickname and ELO update preferences')
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
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('toggle_elo_updates')
      .setDescription('Toggle whether your nickname should be updated with ELO')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const discordid = interaction.user.id;
    const guildid = interaction.guildId;
    
    if (!guildid) {
      await interaction.reply({
        content: 'This command can only be used in a server!',
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'set_nickname') {
      const nickname = interaction.options.getString('nickname', true);
      const cleanNick = cleanNickname(nickname);
      
      await updateNickname(discordid, guildid, cleanNick);
      await updatePlayerData(interaction.client);

      await interaction.reply({
        content: `Your base nickname has been set to "${cleanNick}"!`,
        ephemeral: true,
      });
    } else if (subcommand === 'toggle_elo_updates') {
      const user = await getUser(discordid);
      const currentOptout = user?.optout ?? false;
      await updateOptout(discordid, !currentOptout);
      await updatePlayerData(interaction.client);

      await interaction.reply({
        content: currentOptout
          ? "You've been opted back in to ELO updates! Your nickname will now be updated with your ELO."
          : "You've been opted out of ELO updates! Your nickname will no longer be modified with your ELO.",
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error('Error in manage_nick command: ', error);
    await interaction.reply({
      content: 'Something went wrong! Ask @liamhi for help.',
      ephemeral: true,
    });
  }
}
