import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { dynamoInteract, getSteamid64 } from "@scope/shared";
import { updatePlayerData } from "@scope/functions";

export const data = new SlashCommandBuilder()
  .setName("link_steam_other")
  .setDescription(
    "ADMIN ONLY. Link any user's Discord account to their Steam profile!",
  )
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription("The Discord member you'd like to setup the link with.")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("steam_url")
      .setDescription("The link to the user's Steam profile")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const steamURL = interaction.options.getString("steam_url");
    const target = interaction.options.getUser("target");
    const discordid = target!.id;
    const guildid = interaction.guildId;

    // check that user exists in the server
    const member = interaction.guild!.members.cache.get(discordid) ||
      await interaction.guild!.members.fetch(discordid).catch(() => null);
    if (!member) {
      await interaction.reply("Could not find the target in this server.");
      return;
    }

    const nickname = member.nickname || member.displayName;

    const steamid64 = await getSteamid64(steamURL!);
    await interaction.reply({
      content:
        `Your request to link ${nickname}'s Steam has been received! Their info will be updated shortly.`,
      ephemeral: true,
    });

    await dynamoInteract.addUser(discordid, steamid64, guildid, nickname);

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
