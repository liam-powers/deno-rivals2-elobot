import { type Guild, type GuildMember, PermissionFlagsBits } from "discord.js";

export default function canBotModifyNickname(
  guild: Guild,
  member: GuildMember,
  bot: GuildMember,
): boolean {
  if (!bot.permissions.has(PermissionFlagsBits.ManageNicknames)) {
    return false;
  }

  if (guild.ownerId === member.id) {
    return false;
  }

  if (member.roles.highest.position >= bot.roles.highest.position) {
    return false;
  }

  return true;
}
