import { type Guild, type GuildMember, PermissionFlagsBits } from 'discord.js';

export function canBotModifyNickname(
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

export function cleanHexCode(
  hexCode: string | null,
): string | undefined {
  if (!hexCode) {
    return;
  }

  const hexSet = new Set();
  const hexVals = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
  ];
  hexVals.forEach((hexVal) => hexSet.add(hexVal));

  try {
    let currHexCode = hexCode;
    if (currHexCode.startsWith('#')) {
      currHexCode = currHexCode.slice(1);
    }

    if (currHexCode.length !== 6) {
      throw new Error();
    }

    for (let i = 0; i < currHexCode.length; i++) {
      if (!(hexSet.has(currHexCode[i].toUpperCase()))) {
        throw new Error();
      }
    }
    currHexCode = '#' + currHexCode;
    return currHexCode;
  } catch (error) {
    throw new Error(`Error cleaning hex code! ${error}`);
  }
}

export function cleanNickname(nickname: string): string {
  // Remove the pattern (1503|#766) from the end of the nickname
  return nickname.replace(/\s*\(\d+\|#?\d+\)$/, '');
}

export function executeWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Your promise timed out!',
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

import { ofetch } from 'ofetch';

export async function getSteamid64(steamURL: string): Promise<string> {
  const STEAM_API_KEY = Deno.env.get('STEAM_API_KEY');  
  if (!STEAM_API_KEY) {
    throw new Error("getSteamid64: Couldn't get .env variables!");
  }

  const steamURLArr = steamURL.split('/');
  let suffix;
  if (steamURLArr[steamURLArr.length - 1] == '') {
    suffix = steamURLArr[steamURLArr.length - 2];
  } else {
    suffix = steamURLArr[steamURLArr.length - 1];
  }

  const resolveVanityURL =
    `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${STEAM_API_KEY}&vanityurl=${suffix}`;

  const res = await ofetch(resolveVanityURL);
  let steamID64: string;
  if (res.response.success == 1) {
    steamID64 = res.response.steamid;
  } else if (res.response.success == 42) {
    steamID64 = suffix;
  } else {
    throw new Error('Something went wrong fetching the Steam URL...');
  }

  return steamID64;
}
