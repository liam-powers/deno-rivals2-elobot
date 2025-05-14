import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { canBotModifyNickname, supabase } from "@scope/shared";

export const data = new SlashCommandBuilder()
  .setName("opt_out_other")
  .setDescription("Elect for another user to opt out of nickname updates.")
  .addUserOption((option) =>
    option
      .setName("target")
      .setDescription(
        "The Discord member you'd like to opt out of nickname updates.",
      )
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("new_nickname")
      .setDescription("The nickname you'd like the bot to set their name to.")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const target = interaction.options.getUser("target");
    const discordid = target!.id;
    await supabase.updateOptout(discordid, true);

    const guild = interaction.guild;
    const member = await guild!.members.fetch(discordid);
    const bot = member.guild.members.me;

    if (bot && canBotModifyNickname(guild!, member, bot)) {
      const nickname = interaction.options.getString("new_nickname");
      supabase.updateNickname(discordid, guild!.id, nickname!);
      await member.setNickname(nickname);
      await interaction.reply({
        content:
          "They've been opted out, and I've changed their nickname to what you specified.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content:
          "They've've been opted out, but I lack permission to change their nickname.",
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
