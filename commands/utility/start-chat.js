// A command to start a chat with local AI model.

const { Ollama } = require('ollama');
const { SlashCommandBuilder } = require('discord.js');

// Redefining default client to use local model
const ollama = new Ollama({ host: 'http://127.0.0.1:11434' })

module.exports = {
	data: new SlashCommandBuilder()
		.setName('start-chat')
		.setDescription('Starts a chat with local AI model.'),
	async execute(interaction) {
        // Taking 15-minute time span for generation
        await interaction.deferReply();

        // Requesting the model to generate an answer
        const response = await ollama.chat({
            model: 'gemma3:latest',
            messages: [
                {
                    role: 'system',
                    content: 'You\'re an assistant unit specializing in giving short and condensed answers. Continue the following chat between you and the user. Your next answer must contain one or two short sentences. Highlight key words or definitions using markdown. Don\'t give any feedback about the question, write only the information needed to answer the question.'
                },
                {
                    role: 'user',
                    content: 'Why is the sky blue?'
                }
            ]
        })
        
        // Editing reply since it's already been sent with deferReply()
        await interaction.editReply(response.message.content)
	}
};