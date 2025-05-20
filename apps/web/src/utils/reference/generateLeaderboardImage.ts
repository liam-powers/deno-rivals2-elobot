// import { ofetch } from 'ofetch';
// import type { Guild } from 'discord.js';
// import { getNameColor, type interfaces } from '@scope/shared';
// import sharp from 'sharp';
// import { Buffer } from 'node:buffer';

// export default async function generateLeaderboardImage(
//   usersLeaderboardInfo: interfaces.UserLeaderboardInfo[],
//   guild: Guild,
//   entriesPerColumn = 10,
//   descriptionColor = 'white',
//   backgroundColor = 'black',
//   lowDetailMode = true,
// ): Promise<Buffer[]> {
//   const buffers: Buffer[] = [];
//   if (usersLeaderboardInfo.length === 0) {
//     console.log('Given empty usersLeaderboardInfo... returning.');
//     return buffers;
//   }
//   const readableTime = new Date().toLocaleString();

//   const entries = usersLeaderboardInfo.sort((a, b) => b.elo - a.elo);
//   let i = 0;
//   const rankedEntries = entries.map((entry) => {
//     i += 1;
//     entry.serverRank = i;
//     return entry;
//   });

//   const nColumns = Math.ceil(rankedEntries.length / entriesPerColumn);
//   const entryHeight = 200;
//   const canvasWidth = 1000;
//   const avatarSize = 180;
//   const textAreaWidth = 800;
//   let maxCanvasHeight = 0;

//   for (let i = 0; i < nColumns; i++) {
//     const begin = i * entriesPerColumn;
//     const end = Math.min(begin + entriesPerColumn, rankedEntries.length);
//     const nEntries = end - begin;
//     if (nEntries <= 0) {
//       throw new Error(`No valid user entries to render for column ${i}`);
//     }

//     const canvasHeight = nEntries * entryHeight;

//     const backgroundBuffer = await sharp({
//       create: {
//         width: canvasWidth,
//         height: canvasHeight,
//         channels: 4,
//         background: backgroundColor,
//       },
//     })
//       .png()
//       .toBuffer();

//     const entryBuffers = await Promise.all(
//       rankedEntries.slice(begin, end).map(async (entry, index) => {
//         maxCanvasHeight = Math.max(maxCanvasHeight, nEntries * entryHeight);

//         const nameColor = getNameColor(entry.elo);
//         const avatarBuffer = new Uint8Array(
//           await ofetch(entry.imageURL, { responseType: 'arrayBuffer' }),
//         );

//         const resizedAvatarBuffer = await sharp(avatarBuffer)
//           .resize(avatarSize, avatarSize)
//           .png()
//           .toBuffer();

//         const textBuffer = await sharp({
//           create: {
//             width: textAreaWidth,
//             height: entryHeight,
//             channels: 4,
//             background: backgroundColor,
//           },
//         })
//           .composite([
//             {
//               input: lowDetailMode
//                 ? Buffer.from(
//                   `<svg width="${textAreaWidth}" height="${entryHeight}">
//                   <text x="0" y="80" font-size="80" font-family="Coolvetica" fill="${nameColor}">
//                       #${entry.serverRank}: ${entry.nickname}
//                   </text>
//                   <text x="0" y="160" font-size="60" font-family="Coolvetica" fill="${nameColor}">
//                       ${entry.elo}
//                   </text>
//               </svg>`,
//                   'utf-8',
//                 )
//                 : Buffer.from(
//                   `<svg width="${textAreaWidth}" height="${entryHeight}">
//                                 <text x="10" y="40" font-size="30" font-family="Coolvetica" fill="${nameColor}">
//                                     ${entry.nickname}
//                                 </text>
//                                 <text x="10" y="90" font-size="20" font-family="Coolvetica" fill="${descriptionColor}">
//                                     ELO: ${entry.elo}
//                                 </text>
//                                 <text x="10" y="120" font-size="20" font-family="Coolvetica" fill="${descriptionColor}">
//                                     Global Rank: #${entry.globalRank}
//                                 </text>
//                                 <text x="10" y="150" font-size="20" font-family="Coolvetica" fill="${descriptionColor}">
//                                     Server Rank: #${entry.serverRank}
//                                 </text>
//                                 <text x="10" y="180" font-size="20" font-family="Coolvetica" fill="${descriptionColor}">
//                                     Winstreak: ${entry.winstreak}
//                                 </text>
//                             </svg>`,
//                   'utf-8',
//                 ),
//               top: 0,
//               left: 0,
//             },
//           ])
//           .png()
//           .toBuffer();

//         const combinedBuffer = await sharp({
//           create: {
//             width: canvasWidth,
//             height: entryHeight,
//             channels: 4,
//             background: { r: 255, g: 255, b: 255, alpha: 0 },
//           },
//         })
//           .composite([
//             { input: resizedAvatarBuffer, top: 10, left: 10 },
//             { input: textBuffer, top: 0, left: avatarSize + 20 },
//           ])
//           .png()
//           .toBuffer();

//         return { buffer: combinedBuffer, top: index * entryHeight };
//       }),
//     );

//     const avgElo = Math.round(
//       rankedEntries.slice(begin, end).reduce(
//         (sum, entry) => sum + entry.elo,
//         0,
//       ) / nEntries,
//     );
//     const avgGlobalRank = Math.round(
//       rankedEntries.slice(begin, end).reduce(
//         (sum, entry) => sum + entry.globalRank,
//         0,
//       ) / nEntries,
//     );

//     let infoBuffer;
//     let finalImageBuffer;
//     if (!lowDetailMode) {
//       infoBuffer = await sharp({
//         create: {
//           width: canvasWidth,
//           height: entryHeight,
//           channels: 4,
//           background: { r: 255, g: 255, b: 255, alpha: 0 },
//         },
//       })
//         .composite([
//           {
//             input: Buffer.from(
//               `<svg width="${canvasWidth}" height="${entryHeight}">
//                             <text x="${
//                 canvasWidth - 10
//               }" y="40" font-size="20" font-family="Coolvetica" font-weight="bold" fill="${descriptionColor}" text-anchor="end">
//                                 Column ${i + 1}
//                             </text>
//                             <text x="${
//                 canvasWidth - 10
//               }" y="70" font-size="20" font-family="Coolvetica" fill="${descriptionColor}" text-anchor="end">
//                                 Average ELO: ${avgElo.toFixed(0)}
//                             </text>
//                             <text x="${
//                 canvasWidth - 10
//               }" y="100" font-size="20" font-family="Coolvetica" fill="${descriptionColor}" text-anchor="end">
//                                 Average Rank: ${avgGlobalRank.toFixed(0)}
//                             </text>
//                         </svg>`,
//               'utf-8',
//             ),
//             top: 0,
//             left: 0,
//           },
//         ])
//         .png()
//         .toBuffer();

//       finalImageBuffer = await sharp(backgroundBuffer)
//         .composite(
//           entryBuffers.map(({ buffer, top }) => ({
//             input: buffer,
//             top: top,
//             left: 0,
//           })).concat({
//             input: infoBuffer,
//             top: 0,
//             left: 0,
//           }),
//         )
//         .png()
//         .toBuffer();
//     } else {
//       finalImageBuffer = await sharp(backgroundBuffer)
//         .composite(
//           entryBuffers.map(({ buffer, top }) => ({
//             input: buffer,
//             top: top,
//             left: 0,
//           })),
//         ).png().toBuffer();
//     }
//     buffers.push(finalImageBuffer);
//   }

//   const discordIconURL = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
//   const guildIconBuffer = await ofetch(discordIconURL, {
//     responseType: 'arrayBuffer',
//   });

//   const guildIconScalar = Math.floor(
//     Math.min(maxCanvasHeight, canvasWidth) * 0.6,
//   );
//   const resizedGuildIconBuffer = await sharp(new Uint8Array(guildIconBuffer))
//     .resize(guildIconScalar)
//     .png()
//     .toBuffer();
//   const resizedGuildIconMetadata = await sharp(resizedGuildIconBuffer)
//     .metadata();

//   let textSummaryBuffer;

//   if (!lowDetailMode) {
//     textSummaryBuffer = await sharp({
//       create: {
//         width: canvasWidth,
//         height: maxCanvasHeight,
//         channels: 4,
//         background: { r: 255, g: 255, b: 255, alpha: 0 },
//       },
//     })
//       .composite([
//         {
//           input: Buffer.from(
//             `<svg width="${canvasWidth}" height="${entryHeight}">
//                         <text x="${
//               canvasWidth / 2
//             }" y="40" font-size="30" font-family="Coolvetica" font-weight="bold" fill="${descriptionColor}" text-anchor="middle">
//                             ${guild.name}
//                         </text>
//                         <text x="${
//               canvasWidth / 2
//             }" y="80" font-size="20" font-family="Coolvetica" fill="${descriptionColor}" text-anchor="middle">
//                             Average ELO: ${
//               Math.round(
//                 rankedEntries.reduce((sum, entry) => sum + entry.elo, 0) /
//                   rankedEntries.length,
//               )
//             }
//                         </text>
//                         <text x="${
//               canvasWidth / 2
//             }" y="110" font-size="20" font-family="Coolvetica" fill="${descriptionColor}" text-anchor="middle">
//                             Average Global Rank: ${
//               Math.round(
//                 rankedEntries.reduce(
//                   (sum, entry) => sum + entry.globalRank,
//                   0,
//                 ) /
//                   rankedEntries.length,
//               )
//             }
//                         </text>
//                         <text x="${
//               canvasWidth / 2
//             }" y="140" font-size="20" font-family="Coolvetica" fill="${descriptionColor}" text-anchor="middle">
//                             Tracking ${rankedEntries.length} users
//                         </text>
//                         <text x="${
//               canvasWidth / 2
//             }" y="170" font-size="20" font-family="Coolvetica" fill="${descriptionColor}" text-anchor="middle">
//                             Generated ${readableTime}
//                         </text>
//                     </svg>`,
//             'utf-8',
//           ),
//           top: 0,
//           left: 0,
//         },
//       ])
//       .png()
//       .toBuffer();
//   }

//   if (!lowDetailMode) {
//     const summaryBuffer = await sharp({
//       create: {
//         width: canvasWidth,
//         height: maxCanvasHeight,
//         channels: 4,
//         background: backgroundColor,
//       },
//     })
//       .composite([
//         {
//           input: resizedGuildIconBuffer,
//           top: 20,
//           left: Math.floor(
//             (canvasWidth - (resizedGuildIconMetadata.width || 0)) / 2,
//           ),
//         },
//         {
//           input: textSummaryBuffer,
//           top: (resizedGuildIconMetadata.height || 0) + 40,
//           left: 0,
//         },
//       ])
//       .png()
//       .toBuffer();

//     buffers.unshift(summaryBuffer);
//   }

//   const totalWidth = buffers.length * canvasWidth;
//   const finalBuffer = await sharp({
//     create: {
//       width: totalWidth,
//       height: maxCanvasHeight,
//       channels: 4,
//       background: { r: 255, g: 255, b: 255, alpha: 0 },
//     },
//   })
//     .composite(
//       buffers.map((buffer, index) => ({
//         input: buffer,
//         top: 0,
//         left: index * canvasWidth,
//       })),
//     )
//     .png()
//     .toBuffer();

//   buffers.push(finalBuffer);

//   return [buffers[buffers.length - 1]];
// }
