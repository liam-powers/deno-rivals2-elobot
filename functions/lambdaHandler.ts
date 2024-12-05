import {
  generateInspectCard,
  generateLeaderboardImage,
  updatePlayerData,
} from "@scope/functions";

// To avoid having to maintain 3 different Lambda handlers, we'll use Deno's
//  script arguments to enable us to reuse this same Lambda handler.
//  Then, the only difference in our Dockerfiles will be whatever script arguments
//  we pass into our Lambda handler, making them easy to maintain.
// See: https://docs.deno.com/runtime/getting_started/command_line_interface/#passing-script-arguments

Deno.serve(async (req) => {
  const funcName = Deno.args[0];
  if (!funcName) {
    return new Response(
      "lambdaHandler.ts: You must provide a funcName in the script args!",
      { status: 404 },
    );
  }

  console.log("Received funcName", funcName);

  switch (funcName) {
    case "generateInspectCard":
      try {
        const { user, guildid, descriptionColor, backgroundColor } = await req
          .json();
        const buffer = await generateInspectCard(
          user,
          guildid,
          descriptionColor,
          backgroundColor,
        );
        return new Response(buffer, { status: 200 });
      } catch (error) {
        console.error(error);
        return new Response(null, { status: 400 });
      }
    case "generateLeaderboardImage":
      try {
        const {
          usersLeaderboardInfo,
          guild,
          entriesPerColumn,
          descriptionColor,
          backgroundColor,
          lowDetailMode,
        } = await req
          .json();
        const buffer = await generateLeaderboardImage(
          usersLeaderboardInfo,
          guild,
          entriesPerColumn,
          descriptionColor,
          backgroundColor,
          lowDetailMode,
        );
        return new Response(buffer, { status: 200 });
      } catch (error) {
        console.error(error);
        return new Response(null, { status: 400 });
      }
    case "updatePlayerData":
      try {
        const { client } = await req.json();
        await updatePlayerData(client);
        return new Response(null, { status: 200 });
      } catch (error) {
        console.error(error);
        return new Response(null, { status: 400 });
      }
    default:
      return new Response(
        "Provided funcName Deno script arg doesn't match any existing functions",
        { status: 404 },
      );
  }
});
