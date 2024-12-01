import { ofetch } from "ofetch";

export default async function getSteamid64(steamURL: string): Promise<string> {
  const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY");
  if (!STEAM_API_KEY) {
    throw new Error("getSteamid64: Couldn't get .env variables!");
  }

  const steamURLArr = steamURL.split("/");
  let suffix;
  if (steamURLArr[steamURLArr.length - 1] == "") {
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
    throw new Error("Something went wrong fetching the Steam URL...");
  }

  return steamID64;
}
