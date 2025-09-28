// An event triggered upon interacting with the bot.
// * Note: currently only chat input (such as slash-commands) are being accepted.

const { Events, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Accessing client's respective command
        const command = interaction.client.commands.get(interaction.commandName);
        // If not found -> log the error and do nothing
        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        // Autocompleting command's option if requested
        if (interaction.isAutocomplete()) {
            try { await command.autocomplete(interaction); }
            catch (error) { console.error(error); }
            finally { return; }
        }

        // Ignoring all inputs except slash commands
        if (!interaction.isChatInputCommand()) return;

        // Trying to execute the command otherwise
        try {
            await command.execute(interaction);
        }
        // If failed -> provide feedback
        catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({
                    content: 'There was an error while executing this command!',
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    }
};