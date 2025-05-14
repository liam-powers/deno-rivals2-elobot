import { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { supabase } from "@scope/shared";

export const data = new SlashCommandBuilder()
  .setName("remove_steam")
  .setDescription("Remove your steam link to avoid being tracked by the bot!");

export async function execute(interaction: ChatInputCommandInteraction) {
  const discordid = interaction.user.id;
  try {
    await supabase.deleteUser(discordid);
    await interaction.reply({
      content:
        "Successfully deleted your database entry! You will no longer be tracked.",
      ephemeral: true,
    });
  } catch (error) {
    console.error("remove_steam execute error:", error);
    await interaction.reply({
      content:
        "Something went wrong when removing you from the database!! Try again.",
      ephemeral: true,
    });
  }
}
