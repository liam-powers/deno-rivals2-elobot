import { AttachmentBuilder, ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { cleanHexCode, dynamoInteract } from "@scope/shared";
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
      .setName("name_color")
      .setDescription("Hex code for the player nicknames.")
      .setRequired(false)
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
  const target = interaction.options.getUser("target");
  const uncleanNameColor = interaction.options.getString("name_color");
  const uncleanDescriptionColor = interaction.options.getString(
    "description_color",
  );
  const uncleanBackgroundColor = interaction.options.getString(
    "background_color",
  );

  await interaction.reply("Give me a second to generate the summary image...");

  let nameColor, descriptionColor, backgroundColor;
  try {
    nameColor = cleanHexCode(uncleanNameColor) || "black";
    descriptionColor = cleanHexCode(uncleanDescriptionColor) || "black";
    backgroundColor = cleanHexCode(uncleanBackgroundColor) || "white";
  } catch (_error) {
    await interaction.editReply(
      "Something went wrong parsing your colors! Make sure your hex codes are in the format FFFFFF or #FFFFFF.",
    );
    return;
  }

  const user = await dynamoInteract.getUser(target!.id);
  if (!user) {
    await interaction.reply({
      content: "Couldn't find target in database!",
      ephemeral: true,
    });
    return;
  }

  const buffer = await generateInspectCard(
    user,
    interaction.guild!.id,
    nameColor,
    descriptionColor,
    backgroundColor,
  );

  const attachment = new AttachmentBuilder(buffer, {
    name: `${target!.id}_summary.png`,
  });
  await interaction.editReply({ files: [attachment] });
}
