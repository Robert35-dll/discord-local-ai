// A command to reload commands via chat interaction.

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reload-commands')
		.setDescription('Reloads a command.')
		.addStringOption(option =>
			option.setName('command')
				.setDescription('The command to reload.')
                .setAutocomplete(true)
				.setRequired(true)),
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
		const choices = Array.from(interaction.client.commands.keys());
		const filtered = choices.filter(choice => choice.includes(focusedValue));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice }))
		);
    },
	async execute(interaction) {
        const commandName = interaction.options.getString('command', true).toLowerCase();
		const command = interaction.client.commands.get(commandName);

		if (!command) {
			return interaction.reply(`There is no command with name \`${commandName}\`!`);
		}
        
        delete require.cache[require.resolve(`./${command.data.name}.js`)];

        try {
            const newCommand = require(`./${command.data.name}.js`);
            interaction.client.commands.set(newCommand.data.name, newCommand);
            await interaction.reply(`Command \`${newCommand.data.name}\` was reloaded!`);
        } catch (error) {
            console.error(error);
            await interaction.reply(`There was an error while reloading a command \`${command.data.name}\`:\n\`${error.message}\``);
        }
    },
};