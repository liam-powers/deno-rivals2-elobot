import { AttachmentBuilder, ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import {
  cleanHexCode,
  supabase,
  executeWithTimeout,
} from "@scope/shared";
import { generateInspectCard } from "@scope/functions";

export const data = new SlashCommandBuilder()
  .setName("inspect")
  .setDescription("Get detailed information about a user's ELO.")
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription("The Discord member you'd like to inquire about.")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("description_color")
      .setDescription("Hex code for the player description info.")
      .setRequired(false)
  )
  .addStringOption((option) =>
    option
      .setName("background_color")
      .setDescription("Hex code for the background color.")
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const startTime = Date.now();
  const target = interaction.options.getUser("target");
  const uncleanDescriptionColor = interaction.options.getString(
    "description_color",
  );
  const uncleanBackgroundColor = interaction.options.getString(
    "background_color",
  );

  await interaction.reply("Give me a second to generate the summary image...");

  let descriptionColor, backgroundColor;
  try {
    descriptionColor = cleanHexCode(uncleanDescriptionColor) || "white";
    backgroundColor = cleanHexCode(uncleanBackgroundColor) || "black";
  } catch (_error) {
    await interaction.editReply(
      "Something went wrong parsing your colors! Make sure your hex codes are in the format FFFFFF or #FFFFFF.",
    );
    return;
  }

  const user = await supabase.getUser(target!.id);
  if (!user) {
    await interaction.editReply(`Couldn't find target ${target} in database!`);
    return;
  }

  if (!(interaction.guildId! in user.guildid_to_nickname)) {
    await interaction.editReply(
      `Couldn't find target ${target} in database for this server! This is strange. Try asking them to link their Steam in this specific server again?`,
    );
    return;
  }

  let buffer;
  try {
    buffer = await executeWithTimeout(
      generateInspectCard(
        user,
        interaction.guild!.id,
        descriptionColor,
        backgroundColor,
      ),
      20000,
    );
  } catch (_error) {
    await interaction.editReply(
      "Generating the inspect player card took more than 20 seconds and the function timed out! Contact @liamhi on Discord for support.",
    );
    return;
  }

  const attachment = new AttachmentBuilder(buffer, {
    name: `${target!.id}_summary.png`,
  });

  const readableTime = new Date().toLocaleString();
  const elapsedSeconds = (Date.now() - startTime) / 1000;
  await interaction.editReply({
    content:
      `Here's ${target}'s information as of ${readableTime}, delivered to you in ${
        elapsedSeconds.toFixed(2)
      } seconds.`,
    files: [attachment],
  });
}
