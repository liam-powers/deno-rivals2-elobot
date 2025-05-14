import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { supabase } from "@scope/shared";

export const data = new SlashCommandBuilder()
  .setName("update_nick_other")
  .setDescription(
    "ADMIN ONLY. Update the base nickname for anyone's score updates!",
  )
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription("The Discord member you'd like to setup the link with.")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("nickname")
      .setDescription("The new nickname you'd like for the user.")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const discordid = interaction.options.getUser("target")!.id;
  const nickname = interaction.options.getString("nickname");
  const guildid = interaction.guildId;

  try {
    await supabase.updateNickname(discordid, guildid, nickname!);
    await interaction.reply({
      content: `Updated their nickname to ${nickname}!`,
      ephemeral: true,
    });
  } catch (_error) {
    await interaction.reply({
      content:
        "Something went wrong with updating their nickname! Maybe they're not in the database yet?",
      ephemeral: true,
    });
  }
}
