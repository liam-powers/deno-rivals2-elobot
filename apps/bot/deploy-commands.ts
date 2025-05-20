import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { ofetch } from 'npm:ofetch';
import * as denoPath from 'jsr:@std/path';
import 'jsr:@std/dotenv/load';

const clientid = Deno.env.get('DISCORD_CLIENT_ID');
const token = Deno.env.get('DISCORD_TOKEN');
if (!clientid || !token) {
  throw new Error("Couldn't find .env variables for deploy-commands.ts!");
}

const __dirname = denoPath.dirname(denoPath.fromFileUrl(import.meta.url));

const commands = [];
// Load all command files from the commands directory
const commandsPath = denoPath.join(__dirname, 'commands');

for await (const dirEntry of Deno.readDir(commandsPath)) {
  if (dirEntry.isFile && dirEntry.name.endsWith('.ts')) {
    const filePath = denoPath.join(commandsPath, dirEntry.name);
    const command = await import(filePath);
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      console.log(`Loaded command for deployment: ${command.data.name}`);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(token);

// and deploy your commands!
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`,
    );

    await rest.put(Routes.applicationCommands(clientid), { body: [] }); // Clear all global commands
    let data;
    try {
      const DISCORD_CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID');
      data = await ofetch(
        `https://discord.com/api/v10/applications/${DISCORD_CLIENT_ID}/commands`,
        {
          // @ts-ignore doesn't like PUT for some reason, but this is defined in ofetch api
          method: 'PUT',
          headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json; charset=UTF-8',
            'User-Agent': `DiscordBot (discord.js, 14.16.3 (modified))`,
          },
          body: JSON.stringify(commands),
        },
      );
    } catch (err) {
      console.error('error adding commands:', err);
      return;
    }

    console.log(
      // @ts-ignore discord doesn't provie typing for this
      `Successfully reloaded ${data.length} application (/) commands.`,
    );
  } catch (error) {
    console.error(error);
  }
})();
