<img src="https://assets-prd.ignimgs.com/2024/10/22/rivals22-1729622235361.jpg" width="200" />
<br/>

# Rivals 2 Elo Bot

A Discord bot for [Rivals of Aether II](https://store.steampowered.com/app/2217000/Rivals_of_Aether_II/) that maps user's Discord accounts to their
score and global rank, allowing for leaderboard and player card image generation, optional appending to nicknames (of non-admin accounts - Discord permissions restricts this!), and more. A brief set of instructions for how to use the slash commands for the bot is available at [this webpage](https://rivals2-elobot-webpage.vercel.app/).

## Examples

**Configurable leaderboard generation via `/leaderboard`**:
<br/>
<img src="https://i.imgur.com/gAbF6EF.png" width="600" />

**Individualized player cards via `/inspect`**:
<br/>
<img src="https://i.imgur.com/HEnFYbj.png" width="400" />

**Appending stats to nicknames automatically (updated every 5 minutes!)**:
<br/>
<img src="https://i.imgur.com/vCluxlx.png" width="400" />

## How it works

- The Discord bot (`/bot`) lives in AWS via Elastic Beanstalk, as it's the web
  service tier that needs to be always available.
- The compute-bound functions (`/functions`) also live in EB, but are in a separate folder for organization (they're beefy), and are reserved for image generation and manipulation, parsing multiple Steam leaderboard XML pages, and any other misc. compute tasks.
- The /`shared` folder contains interfaces for TypeScript typing and a set of
  utility functions for tasks such as cleaning hex code, resolving Steam URL's
  into their SteamID64's, and most importantly, interacting with the tables in
  AWS DynamoDB (see `TABLES.md`).

## Getting up and running both the server and the client

- There are 7 unique .env variables you must generate and place in a .env file in the root. These are as follows:

  1. `AWS_ACCESS_KEY_ID`: The access key to an AWS user, can be found with AWS CLI.
  2. `AWS_SECRET_KEY_ID`: The secret key to an AWS user, can be found with AWS CLI.
  3. `STEAM_API_KEY`: Obtained using [this form](https://steamcommunity.com/dev), and you must have a Steam account.
  4. `DISCORD_TOKEN`: For the remaining variables, they must be generated from Discord. This particular token is found after creating an application [here](https://discord.com/developers/applications) then generating a token under its "Bot" settings tab.
  5. `DISCORD_CLIENT_ID`: Found under the "General Information" settings tab as the Application ID.
  6. `DISCORD_TEST_GUILD_ID`: After enabling Discord's [Developer Mode](https://www.howtogeek.com/714348/how-to-enable-or-disable-developer-mode-on-discord/), right-click on a server's icon you have admin permission to (you can also create a new one) and copy the ID.
  7. `DISCORD_VIBE_GUILD_ID`: Similar to the above - Vibe is the name of the Discord server I used the bot on for actual users, but you're welcome to create another empty Discord server.

- To set up the Discord client, you need to do a couple of things:

1. If you don't already have Deno set up, you'll want to install it to your command line. Instructions for that are [here](https://docs.deno.com/runtime/).
2. Add your newly-created Discord app to your servers by generating an OAuth2 link in the developer window. From the [Developer Portal](https://discord.com/developers/applications), scroll down to the OAuth2 URL generator and give it `applications.commands`, `bot`, `Send Messages`, and `Manage Nicknames` permissions. Then, open the URL you've generated and add it to both of the Discord servers (you may have to open the URL once for each server).
3. Register the commands. Run `deno task deploy` in the root dir, and if all goes well, you should be able to type `/` in either of your servers and have a variety of commands pop up from the bot.

- To run the server:

1. Run the `start` task in the root dir (`deno task start`). This is also the RUN command in the Dockerfile. You'll know it's working if you can type `/ping` in either of your servers and click on the bot task that runs up and receive a message reply.

Refer to [the webpage](https://rivals2-elobot-webpage.vercel.app/) for the comprehensive guide on how to use the commands.

## Why Deno?

[Deno 2.0](https://deno.com/blog/v2.0) recently released, and I wanted to check it out for a few reasons:

- I wanted a linter and formatter built into my CLI.
- Deno workspaces and deno.json's are a joy to use, and extremely readable.
- No cryptic tsconfig.json issues.
- It comes with a VSCode extension and highlights issues quickly (and my
  previous linter would stop working out of nowhere).
- It slightly outcompetes Bun in common benchmarks (see
  [this image](https://deno.com/blog/v2.0/deno-perf-charts-3x3.png), taken from
  their announcement blog).
