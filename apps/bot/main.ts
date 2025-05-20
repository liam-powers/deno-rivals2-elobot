import { Client, Collection, GatewayIntentBits } from 'discord.js';
import * as denoPath from 'jsr:@std/path';
import 'jsr:@std/dotenv/load';
import { updatePlayerData } from '@bot/utils/updatePlayerData';

const token = Deno.env.get('DISCORD_TOKEN');
if (!token) {
  console.log({ token });
  throw new Error("main.ts for bot: Couldn't find DISCORD_TOKEN!");
}

const __dirname = denoPath.dirname(denoPath.fromFileUrl(import.meta.url));
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.cooldowns = new Collection();
client.commands = new Collection();

// Load commands
const commandsPath = denoPath.join(__dirname, 'commands');
for await (const dirEntry of Deno.readDir(commandsPath)) {
  if (dirEntry.isFile && dirEntry.name.endsWith('.ts')) {
    const filePath = denoPath.join(commandsPath, dirEntry.name);
    const command = await import(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`Loaded command: ${command.data.name}`);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

// Load events
const eventsPath = denoPath.join(__dirname, 'events');
for await (const dirEntry of Deno.readDir(eventsPath)) {
  if (dirEntry.isFile && dirEntry.name.endsWith('.ts')) {
    const filePath = denoPath.join(eventsPath, dirEntry.name);
    const event = await import(filePath);

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`Loaded event: ${event.name}`);
  }
}

client.once('ready', () => {
  client.user!.setActivity("Type /link_steam to get started!");
});

client.login(token);
console.log('Client logged in!');

updatePlayerData(client);

// @ts-ignore this is a legit cron job strategy with Deno
Deno.cron('updatePlayerData cron job', '*/5 * * * *', async () => {
  await updatePlayerData(client);
});
