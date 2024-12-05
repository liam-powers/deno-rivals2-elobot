import { AttachmentBuilder, ChatInputCommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import {
  cleanHexCode,
  dynamoInteract,
  executeWithTimeout,
  type interfaces,
} from "@scope/shared";
import { ofetch } from "ofetch";
import { Buffer } from "node:buffer";
import { generateLeaderboardImage } from "@scope/functions";

// 30 second cooldown, fairly expensive to generate leaderboard image
export const cooldown = 30;

export const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription(
    "Get a leaderboard and summary of all of the players in the server! Displays up to 100 players.",
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
  )
  .addBooleanOption((option) =>
    option
      .setName("high_detail_mode")
      .setDescription("Display additional info on leaderboard?")
      .setRequired(false)
  )
  .addIntegerOption((option) =>
    option
      .setName("entries_per_column")
      .setDescription(
        "The number of entries each column should have at most.",
      )
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const startTime = Date.now();
  const guildid = interaction.guildId;

  const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY");
  if (!STEAM_API_KEY) {
    await interaction.reply({
      content: "Something went wrong with the bot config!",
      ephemeral: true,
    });
    throw new Error("Couldn't get STEAM_API_KEY from .env in leaderboard.ts!");
  }

  await interaction.reply({
    content: "Generating your leaderboard! Give me a few seconds...",
    ephemeral: false,
  });

  const latestUserStats = await dynamoInteract.getLatestUsersStats();
  if (!latestUserStats) {
    console.error("leaderboard command: couldn't find latestUserStats!");
    await interaction.editReply("Something went wrong!");
    return;
  }
  const users = await dynamoInteract.getUsers();

  // filter latestUserStats so we only have entries with steamid's that are featured in this guild
  // const steamid64ToUser: Record<string, User> = {};
  const steamidsInGuild = new Set<string>();
  users.forEach((user) => {
    if (guildid! in user.guildid_to_nickname) {
      steamidsInGuild.add(user.steamid64);
    }
  });
  const guildUserStats = latestUserStats.filter((userStat) =>
    steamidsInGuild.has(userStat.steamid64)
  );
  const guildUsers = users.filter((user) =>
    steamidsInGuild.has(user.steamid64)
  );
  const steamid64ToGuildUserStat: Record<string, interfaces.UserStats> = {};
  const steamid64ToGuildUser: Record<string, interfaces.User> = {};

  guildUserStats.forEach((userStat) => {
    steamid64ToGuildUserStat[userStat.steamid64] = userStat;
  });

  guildUsers.forEach((user) => {
    steamid64ToGuildUser[user.steamid64] = user;
  });

  // generate an image based on the userdata by:
  // 1. fetching steam profile pictures via the Steam API
  const steamids = [...steamidsInGuild].splice(0, 100).join(",");
  const playerSummariesFull = await ofetch(
    `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamids}`,
  );
  const steamid64ToAvatarURL: Record<string, string> = {};

  playerSummariesFull.response.players.forEach(
    (playerSummary: { steamid: string; avatarfull: string }) => {
      steamid64ToAvatarURL[playerSummary.steamid] = playerSummary.avatarfull ||
        "";
    },
  );

  // 2. putting together the leaderboard data
  const usersLeaderboardInfo: interfaces.UserLeaderboardInfo[] = [];
  steamidsInGuild.forEach((steamid) => {
    if (!steamid64ToGuildUserStat[steamid]?.elo) {
      console.log("Found nullish elo for steamid", steamid);
      return;
    }
    usersLeaderboardInfo.push({
      imageURL: steamid64ToAvatarURL[steamid],
      nickname: steamid64ToGuildUser[steamid].guildid_to_nickname[guildid!],
      elo: steamid64ToGuildUserStat[steamid].elo,
      globalRank: steamid64ToGuildUserStat[steamid].rank,
      winstreak: steamid64ToGuildUserStat[steamid].winstreak,
    });
  });

  // 3. creating the leaderboard
  const uncleanDescriptionColor = interaction.options.getString(
    "description_color",
  );
  const uncleanBackgroundColor = interaction.options.getString(
    "background_color",
  );

  let descriptionColor, backgroundColor;
  try {
    descriptionColor = cleanHexCode(uncleanDescriptionColor);
    backgroundColor = cleanHexCode(uncleanBackgroundColor);
  } catch (_error) {
    await interaction.editReply(
      "Something went wrong parsing your colors! Make sure your hex codes are in the format FFFFFF or #FFFFFF.",
    );
    return;
  }

  const entriesPerColumn =
    interaction.options.getInteger("entries_per_column") ||
    undefined;

  const lowDetailMode = !interaction.options.getBoolean("high_detail_mode");

  // TODO: Make a call to the generateLeaderboardImage Lambda URL from lambdaUrls.json with these parameters
  let buffers: Buffer[];
  try {
    buffers = await executeWithTimeout(
      generateLeaderboardImage(
        usersLeaderboardInfo,
        interaction.guild!,
        entriesPerColumn,
        descriptionColor,
        backgroundColor,
        lowDetailMode,
      ),
      20000,
    );
  } catch (_error) {
    await interaction.editReply(
      "The leaderboard function took more than 20 seconds and timed out! Contact @liamhi on Discord for support.",
    );
    return;
  }

  // 4. sending the buffers as an array of attachments with discord.js's AttachmentBuilder
  let i = 0;
  const attachments = buffers.map((buffer: Buffer) => {
    i++;
    return new AttachmentBuilder(buffer, { name: `leaderboard_${i}.png` });
  });

  const readableTime = new Date().toLocaleString();
  const elapsedSeconds = (Date.now() - startTime) / 1000;

  await interaction.editReply({
    content:
      `Here's the server leaderboard as of ${readableTime}, delivered to you in ${
        elapsedSeconds.toFixed(2)
      } seconds.`,
    files: attachments,
  });
}
