//region [Requirements]

const fs = require('node:fs');
const path = require('node:path');
const {
	Client,
	Collection,
	GatewayIntentBits
	} = require('discord.js');
const { token } = require('./config.json');

//region [Instantiation]

// Creating a new client instance
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	]});

//region [Loading]

// Extending client's instance
client.commands = new Collection();

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

		// Adding the new command to the client's Collection
		// * Note: the command (pair's value) is the file's exported object
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		}
		// If command's export doesn't have required properties,
		// log a warning and skip it
		else {
			console.warn(`[WARNING] The command at ${filePath} is missing ` +
						 `a required "data" or "execute" property.`);
		}
	}
}

// Accessing events' files
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath)
					 .filter(file => file.endsWith('.js'));

// Checking retrieved files
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);

	// Adding the new event to the client's properties
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

//region [Login]

// Log in to Discord with your client's token
client.login(token);