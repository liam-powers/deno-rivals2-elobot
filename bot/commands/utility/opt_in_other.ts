import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { supabase } from "@scope/shared";
import { updatePlayerData } from "@scope/functions";

export const data = new SlashCommandBuilder()
  .setName("opt_in_other")
  .setDescription("Elect for another user to opt back in to nickname updates.")
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription(
        "The Discord member you'd like to opt back in to nickname updates.",
      )
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const target = interaction.options.getUser("target");
    const discordid = target!.id;
    await supabase.updateOptout(discordid, false);

    updatePlayerData(interaction.client);

    await interaction.reply({
      content:
        "They've been opted in, and their nickname should be updated soon.",
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error opting in: ", error);
    await interaction.reply({
      content: "Something went wrong with opting in! Ask @liamhi for help.",
      ephemeral: true,
    });
  }
}
