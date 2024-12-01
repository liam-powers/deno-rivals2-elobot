import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction } from "discord.js";
import { dynamoInteract } from "@scope/shared";

export const data = new SlashCommandBuilder()
  .setName("update_nick")
  .setDescription("Update the base nickname for your score updates!")
  .addStringOption((option) =>
    option
      .setName("nickname")
      .setDescription("The new nickname you'd like.")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const discordid = interaction.user.id;
  const nickname = interaction.options.getString("nickname");
  const guildid = interaction.guildId;

  try {
    await dynamoInteract.updateNickname(discordid, guildid, nickname!);
    await interaction.reply({
      content: `Updated your nickname to ${nickname}!`,
      ephemeral: true,
    });
  } catch (_error) {
    await interaction.reply({
      content: "Something went wrong with updating your nickname! Try again.",
      ephemeral: true,
    });
  }
}
