// The default commands' deployment script provided by official
// Discord API tutorial:
// https://discordjs.guide/creating-your-bot/command-deployment.html#guild-commands

//region [Requirements]

const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

//region [Loading]

const commands = [];
// Accessing commands' directory and subdirectories
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Checking the subdirectories' files
for (const folder of commandFolders) {
	// Accessing commands' files
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath)
						   .filter(file => file.endsWith('.js'));

	// Checking retrieved files
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);

		// Adding the new command in the command list
		// * Note: the command is the file's exported object
		// * and should be represented in JSON format
		if ('data' in command && 'execute' in command) {
			commands.push(command.data.toJSON());
		}
		// If command's export doesn't have required properties,
		// log a warning and skip it
		else {
			console.warn(`[WARNING] The command at ${filePath} is missing ` +
						 `a required "data" or "execute" property.`);
		}
	}
}

//region [Deploying]

// Constructing and preparing an instance of the REST module
const rest = new REST().setToken(token);

// Deploying loaded commands
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} ` +
					`application (/) commands.`);

		// Pushing commands
		// * Note: The PUT method is used to fully refresh all commands
		// * in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} ` +
					`application (/) commands.`);
	}
	// If failed -> provide feedback
	catch (error) {
		console.error(error);
	}
})();