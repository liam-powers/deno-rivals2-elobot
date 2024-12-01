import { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { dynamoInteract } from "@scope/shared";
import { updatePlayerData } from "@scope/functions";

export const data = new SlashCommandBuilder()
  .setName("opt_in")
  .setDescription("Elect to opt back in to nickname updates.");

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const discordid = interaction.user.id;
    await dynamoInteract.updateOptout(discordid, false);
    // TODO: Update player data via lambdaURL for updatePlayerData!
    updatePlayerData(interaction.client);

    await interaction.reply({
      content:
        "Okay, you've been opted back in to nickname updates! Your nickname should be updated soon.",
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
