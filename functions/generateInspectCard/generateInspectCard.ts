import type { interfaces } from "@scope/shared";
import { ofetch } from "ofetch";
import { dynamoInteract } from "@scope/shared";
import sharp from "sharp";
import { Buffer } from "node:buffer";
import "jsr:@std/dotenv/load";
import { getNameColor } from "@scope/shared";

interface reqBody {
  user: interfaces.User;
  guildid: string;
  descriptionColor: string;
  backgroundColor: string;
}

export default async function generateInspectCard(req: reqBody) {
  const { user, guildid, descriptionColor, backgroundColor } = req;

  const STEAM_API_KEY = Deno.env.get("STEAM_API_KEY");
  if (!STEAM_API_KEY) {
    throw new Error("Failed to get STEAM_API_KEY inside generateInspectCard!");
  }

  const latestUserStats = await dynamoInteract.getLatestUserStats(
    user.steamid64,
  );
  if (!latestUserStats) {
    throw new Error("Failed to get userStats inside generateInspectCard!");
  }

  const readableTime = new Date().toLocaleString();
  const playerSummary = await ofetch(
    `http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${user.steamid64}`,
  );

  const avatarSize = 200;

  const avatarURL = playerSummary.response.players[0].avatarfull;
  const avatarBuffer = await ofetch(avatarURL, { responseType: "arrayBuffer" });
  const resizedAvatarBuffer = await sharp(Buffer.from(avatarBuffer))
    .resize(avatarSize, avatarSize)
    .png()
    .toBuffer();

  const nameColor = getNameColor(latestUserStats.elo);

  const textSummaryBuffer = await sharp({
    create: {
      width: avatarSize * 2,
      height: avatarSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${avatarSize * 2}" height="${avatarSize}">
                              <text x="10" y="40" font-size="30" font-family="Coolvetica" fill="${nameColor}">
                                  ${user.guildid_to_nickname[guildid]}
                              </text>
                              <text x="10" y="80" font-size="20" font-family="Coolvetica" fill="${descriptionColor}">
                                  ELO: ${latestUserStats.elo}
                              </text>
                              <text x="10" y="110" font-size="20" font-family="Coolvetica" fill="${descriptionColor}">
                                  Rank: #${latestUserStats.rank}
                              </text>
                              <text x="10" y="140" font-size="20" font-family="Coolvetica" fill="${descriptionColor}">
                                  Winstreak: ${latestUserStats.winstreak}
                              </text>
                              <text x="10" y="170" font-size="20" font-family="Coolvetica" fill="${descriptionColor}">
                                  Generated ${readableTime}
                              </text>
                          </svg>`,
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

  const buffer = await sharp({
    create: {
      width: (avatarSize * 3) + 20,
      height: avatarSize + 20,
      channels: 4,
      background: backgroundColor,
    },
  })
    .composite([
      { input: resizedAvatarBuffer, top: 10, left: 10 },
      { input: textSummaryBuffer, top: 0, left: avatarSize + 20 },
    ])
    .png()
    .toBuffer();

  // return new Response(buffer, {
  //   status: 200,
  // });
  return buffer;
}
