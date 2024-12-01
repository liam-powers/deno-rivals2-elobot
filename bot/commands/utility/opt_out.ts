import { ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { canBotModifyNickname, dynamoInteract } from "@scope/shared";

export const data = new SlashCommandBuilder()
  .setName("opt_out")
  .setDescription("Elect to opt out of nickname updates.")
  .addStringOption((option) =>
    option
      .setName("new_nickname")
      .setDescription("The nickname you'd like the bot to set your name to.")
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const user = interaction.user;
    const discordid = user.id;
    await dynamoInteract.updateOptout(discordid, true);

    const guild = interaction.guild;
    const member = await guild!.members.fetch(discordid);
    const bot = member.guild.members.me;

    if (bot && canBotModifyNickname(guild!, member, bot)) {
      const nickname = interaction.options.getString("new_nickname");
      dynamoInteract.updateNickname(discordid, guild!.id, nickname!);
      await member.setNickname(nickname);
      await interaction.reply({
        content:
          "You've been opted out, and I've changed your nickname to what you specified.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content:
          "You've been opted out, but I lack permission to change your nickname.",
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("Error opting out: ", error);
    await interaction.reply({
      content: "Something went wrong with opting out! Ask @liamhi for help.",
      ephemeral: true,
    });
  }
}
