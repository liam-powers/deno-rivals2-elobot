import { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { dynamoInteract, getSteamid64 } from "@scope/shared";
import { updatePlayerData } from "@scope/functions";

export const data = new SlashCommandBuilder()
  .setName("link_steam")
  .setDescription("Link your Discord account to your Steam profile!")
  .addStringOption((option) =>
    option
      .setName("steam_url")
      .setDescription("The link to your Steam profile")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const discordid = interaction.user.id;
    const steamURL = interaction.options.getString("steam_url");
    const nickname = interaction.user.displayName;
    const guildid = interaction.guildId;

    const steamid64 = await getSteamid64(steamURL!);
    await interaction.reply({
      content:
        "Your request to link your Steam has been received! Your info will be updated shortly.",
      ephemeral: true,
    });
    dynamoInteract.addUser(discordid, steamid64, guildid!, nickname);
    // TODO: Update player data via link from lambdaUrls.json!
    updatePlayerData(interaction.client);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content:
        "Something went wrong with the Steam URL you provided! Make sure to give the entire thing. I crave data.",
      ephemeral: true,
    });
  }
}
