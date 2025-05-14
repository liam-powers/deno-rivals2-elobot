import type { Client, Guild } from 'discord.js';
import { canBotModifyNickname, type interfaces, supabase } from '@scope/shared';
import { ofetch } from 'ofetch';
import * as cheerio from 'cheerio';

// This is the main cron job and the backbone of the score/elo/win-loss tracking that the bot does.
// 1. Grabs all of the discord id's and steamid's from AWS (DynamoDB?).
// 2. Parses the Rivals of Aether II steam leaderboard in XML format via Cheerio,
//      and gets the current ELO score and global rank of each player.
// 3. Determines the win or loss streak of each player based on the string stored in DynamoDB ("+1", "-3", etc.)
//      , updates that win loss streak in DynamoDB by comparing their newly parsed ELO to their previous ELO entry,
//      , and adds the field to their score + rank object entry.
// 4. Updates the score and rank of the player with a new entry in DynamoDB marked at this time.
// 5. Appends the score, rank, and win/loss streak to the existing nickname of each discord user who gave their
//        steamid for the service, AKA anybody we grabbed info for from our Cheerio XML parsing.
export default async function updatePlayerData(client: Client<boolean>) {
  // 1.
  const users: interfaces.User[] = await supabase.getUsers();
  if (!users) {
    console.error("updatePlayerData() couldn't find users!");
    return;
  }
  const steamid64s = new Set(users.map((user) => user.steamid64));

  // 2.
  // continue parsing the NextRequestURL's until we either run out of pages to parse or we completely populate our newUserStats
  // we'll cap at 100 pages parsed to avoid an infinite loop for any reason
  let newUserStats: interfaces.UserStats[] = [];
  const leaderboard = await ofetch(
    'https://steamcommunity.com/stats/2217000/leaderboards/16200142?xml=1', // spring 2025 leaderboard
  );
  let $ = cheerio.load(leaderboard, { xmlMode: true });
  let i = 0; // limit parsing to 500 leaderboard pages, if it gets over that number something has gone very wrong (currently around 10-15 leaderboard pages)
  const timestamp = Date.now();

  while (
    $('nextRequestURL')?.text()?.length > 0 &&
    users.length > newUserStats.length &&
    i < 500
  ) {
    if (i > 0) {
      const nextLeaderboard = await ofetch($('nextRequestURL').text());
      $ = cheerio.load(nextLeaderboard, { xmlMode: true });
    }
    const entries = $('entry');

    entries.each((_index, entry) => {
      const steamid64 = $(entry).find('steamid').text();
      if (!steamid64 || !steamid64s.has(steamid64)) {
        return;
      }
      const score = $(entry).find('score').text();
      const rank = $(entry).find('rank').text();

      newUserStats.push({
        steamid64,
        timestamp,
        elo: parseInt(score),
        rank: parseInt(rank),
        winstreak: 'TBD',
      });
    });
    i++;
  }

  // 3. figure out winstreak for each player
  const prevUserStats: interfaces.UserStats[] | undefined = await supabase
    .getLatestUsersStats();

  // if there are not latest user stats, we'll default winstreaks to 0
  if (!prevUserStats || prevUserStats.length === 0) {
    newUserStats = newUserStats.map((userStats) => ({
      ...userStats,
      winstreak: '0',
    }));
  } else {
    const prevUserStatsMap = new Map(
      prevUserStats.map((stat) => [stat.steamid64, stat]),
    );

    newUserStats = newUserStats.map((newer) => {
      const prev = prevUserStatsMap.get(newer.steamid64);

      const winstreakFormattedCorrectly = (winstreak: string): boolean => {
        if (
          winstreak === '0' ||
          ((winstreak.startsWith('+') || winstreak.startsWith('-')) &&
            parseInt(winstreak.slice(1)))
        ) {
          return true;
        }
        return false;
      };

      if (!prev) {
        // no previous user found
        newer.winstreak = '0';
      } else if (!winstreakFormattedCorrectly(prev.winstreak)) {
        // prev user + winstreak found, but winstreak is in an odd format
        console.warn(
          `Winstreak ${prev.winstreak} doesn't match format, defaulting to 0`,
        );
        newer.winstreak = '0';
      } else if (prev.elo === newer.elo) {
        // no change in ELO, continue with same properly-formatted winstreak
        newer.winstreak = prev.winstreak;
      } else if (prev.winstreak === '0') {
        // change in ELO to a 0 winstreak
        newer.winstreak = prev.elo < newer.elo ? '+1' : '-1';
      } else if (prev.winstreak.startsWith('+')) {
        // change in ELO to a + winstreak
        const posWinstreakInt = parseInt(prev.winstreak.slice(1));
        newer.winstreak = prev.elo < newer.elo ? '+' + (posWinstreakInt + 1).toString() : '-1';
      } else if (prev.winstreak.startsWith('-')) {
        // change in ELO to a - winstreak
        const negWinStreakInt = parseInt(prev.winstreak.slice(1));
        newer.winstreak = prev.elo > newer.elo ? '-' + (negWinStreakInt - 1).toString() : '+1';
      }
      return newer;
    });
  }

  // 4. add our user stats entries
  await supabase.addUserStatsEntries(newUserStats);

  // 5. append the new ranked scores to Discord nicknames
  // remember, users has all our discordids, nicknames, and steamids
  //          and newUserStats has all our steamids, timestamps, elos, ranks, and winstreaks
  const steamid64ToNewUserStats: Record<string, interfaces.UserStats> = {};
  newUserStats.forEach((newer) => {
    steamid64ToNewUserStats[newer.steamid64] = newer;
  });

  users.forEach((user) => {
    const stats = steamid64ToNewUserStats[user.steamid64];
    if (!stats) {
      console.log("couldn't find stats for user with steamid: ", user);
      return;
    }

    const suffix = ' ' + '(' + stats.elo + '|' + '#' + stats.rank + ')';

    client.guilds.cache.forEach(async (guild: Guild) => {
      try {
        let nickname;
        const member = await guild.members
          .fetch(user.discordid)
          .catch(() => null);
        if (!member) {
          return;
        }
        // we only get the user's nickname in the server they sign up in which has the bot;
        //     therefore, if we're in a different server, we need to fetch their nickname and
        //     store it in their guildid_to_nickname dictionary in Dynamo for later.
        if (guild.id in user.guildid_to_nickname) {
          nickname = user.guildid_to_nickname[guild.id];
        } else {
          nickname = member.nickname || member.displayName;
          if (!nickname) {
            console.error(
              `Couldn't find nickname for existing member with nicknames ${
                Object.values(
                  user.guildid_to_nickname,
                )
              } in server ${guild.name}`,
            );
            return;
          }
          await supabase.updateNickname(
            user.discordid,
            guild.id,
            nickname,
          );
        }

        let newNickname = nickname + suffix;
        if (newNickname.length > 32) {
          newNickname = nickname.slice(0, 32 - suffix.length) + suffix;
        }
        const bot = member.guild.members.me;
        if (bot && canBotModifyNickname(guild, member, bot)) {
          if (user.optout) {
            await member.setNickname(nickname);
          } else {
            await member.setNickname(newNickname);
          }
        }
      } catch (error) {
        console.error(
          `Failed to update nickname for ${
            user.guildid_to_nickname[guild.id]
          } in guild ${guild.name}:`,
          error,
        );
      }
    });
  });

  console.log(`updatePlayerData() success at ${new Date().toLocaleString()}`);
}
