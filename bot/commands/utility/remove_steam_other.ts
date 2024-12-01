import { PermissionFlagsBits } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { dynamoInteract } from "@scope/shared";
import { ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("remove_steam_other")
  .setDescription(
    "Remove someone else's steam link to avoid them being tracked by the bot!",
  )
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription("The Discord member you'd to remove the link from.")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  const discordid = interaction.options.getUser("target")!.id;
  try {
    await dynamoInteract.deleteUser(discordid);
    await interaction.reply({
      content: "Successfully deleted user",
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
