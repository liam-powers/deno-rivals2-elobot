import { Client, Collection, GatewayIntentBits } from "discord.js";
import path from "node:path";
import fs from "node:fs";
import * as denoPath from "jsr:@std/path";
import "jsr:@std/dotenv/load";
import { updatePlayerData } from "@scope/functions";

const token = Deno.env.get("DISCORD_TOKEN");
if (!token) {
  console.log({ token });
  throw new Error("main.ts for bot: Couldn't find DISCORD_TOKEN!");
}

//const __filename = denoPath.fromFileUrl(import.meta.url);
const __dirname = path.dirname(denoPath.fromFileUrl(import.meta.url));
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.cooldowns = new Collection();
client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) =>
    file.endsWith(".ts")
  );
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter((file) =>
  file.endsWith(".ts")
);

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = await import(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.login(token);
console.log("Client logged in!");

updatePlayerData(client);
