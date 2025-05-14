import { ChatInputCommandInteraction, Collection, Events } from "discord.js";

interface Command {
  data: { name: string };
  cooldown?: number;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export const name = Events.InteractionCreate;

export async function execute(interaction: ChatInputCommandInteraction) {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName) as Command;

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  const { cooldowns } = interaction.client;

  if (!cooldowns.has(command.data.name)) {
    cooldowns.set(command.data.name, new Collection<string, number>());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(command.data.name) as Collection<string, number>;
  if (!timestamps) {
    console.error(`No timestamps collection found for command ${command.data.name}`);
    return;
  }
  const defaultCooldownDuration = 3;
  const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

    if (now < expirationTime) {
      const remainingTime = Math.ceil((expirationTime - now) / 1000);
      const minutes = Math.floor(remainingTime / 60);
      const seconds = remainingTime % 60;
      const message = await interaction.reply({
        content:
          `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again in ${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}.`,
        ephemeral: true,
      });
      
      // Delete the message after the cooldown expires
      setTimeout(async () => {
        try {
          await message.delete();
        } catch (error) {
          // Ignore errors if message is already deleted or not found
          console.error('Error deleting cooldown message:', error);
        }
      }, expirationTime - now);
      
      return;
    }
  }

  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
}
