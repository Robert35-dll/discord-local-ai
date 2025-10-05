// A command to start a chat with local AI model.

//region [Setup]

const { GENERAL, REQUEST } = require('../../assets/prompts.json');
const { ChatRoles, PromptPlaceholders, MessageObject } = require('../types');
const { Ollama } = require('ollama');
const { SlashCommandBuilder } = require('discord.js');

// Redefining default client to use local model
const ollama = new Ollama({ host: 'http://127.0.0.1:11434' })

/**
 * The name of the client to sign answers with.
 */
let CLIENT_NAME;

/**
 * The time span to collect messages from users.
 */
const COLLECTOR_TIMEOUT = 30_000;

//endregion
// region [Chat Utils]

/**
 * 
 * @param { MessageObject } message - The message to generate answer to.
 * @param { string } [instruction=REQUEST.COMPLETION] - The prompt to specify
 *                                                      generation with.
 * @param { Array<MessageObject> } [chatHistory=null] - The context of generation
 *                                                      request.
 * @returns { MessageObject } The answer message signed with the client's name.
 */
async function generateAnswer(message,
                              instruction = REQUEST.COMPLETION,
                              chatHistory = null) {
    // Ensuring no empty messages will be answered
    if (!message.content && instruction == REQUEST.COMPLETION) {
        console.warn(`[!] An answer request for message with no content received:\n` +
                     JSON.stringify(value=message, space=2) + '\n' +
                     `[!] Forcing changing request to 'DUMMY'`);
        instruction = REQUEST.DUMMY;
    }

    // Copying chat history and 
    let context = [];
    if (chatHistory.length > 0) {
        chatHistory.forEach(m => { context.push(m) });
    }
    
    // Specifying completion request and putting it into context
    // since it's the only option to communicate with the model
    if (instruction === REQUEST.COMPLETION) {
        instruction.replace(PromptPlaceholders.MESSAGE, message.content);
    }
    let answerRequest = new MessageObject(content=instruction);
    let authorReplacer = message.author ?? 'the user';
    answerRequest.substitutePlaceholders(PromptPlaceholders.USER, authorReplacer);

    context.push(answerRequest);

    // Requesting an answer
    let answer = await ollama.chat({
        model: 'gemma3:latest',
        messages: context
    });

    // and turning it back into a message
    return getMessageObject(
        text=answer.message.content,
        role=ChatRoles.ASSISTANT,
        author=CLIENT_NAME
    );
}

//endregion
//region [Export]

module.exports = {
	data: new SlashCommandBuilder()
		.setName('start-chat')
		.setDescription('Starts a chat with local AI model.')
        .addStringOption(option =>
            option
                .setName('firstMessage')
                .setDescription('Your message to start the chat with.')
        ),
	async execute(interaction) {
        // Updating the client name 
        CLIENT_NAME = interaction.client.displayName;

        // Taking 15-minute time span for generation
        await interaction.deferReply();

        //region [Initialization]

        // Deciding, whether to greet the user or answer the first message directly
        const firstMessage = interaction.options.getString('firstMessage') ?? null;
        const firstInstruction = !firstMessage ? REQUEST.GREETING : REQUEST.COMPLETION;

        // Setting a new chat history

        // Building a message with the general system prompt
        // and inserting the client's name into the content
        let systemPrompt = getMessageObject(
            text=`${GENERAL.CHARACTER} ${GENERAL.ANSWERING} ${GENERAL.FORMATTING}`
        );
        systemPrompt.substitutePlaceholders(
            PromptPlaceholders.ASSISTANT,
            interaction.client.user.displayName
        );
        // Building the first user's message (inclusive null-content)
        const userMessage = getMessageObject(
            text=firstMessage,
            role=ChatRoles.USER,
            author=interaction.user.displayName
        );
        // Adding general prompt to the initial chat history
        interaction.client.chatHistory = [
            systemPrompt
        ];

        // Requesting the local model to generate an answer
        const answerMessage = await generateAnswer(
            message=userMessage,
            instruction=firstInstruction,
            chatHistory=interaction.client.chatHistory
        );

        // Editing reply since it's already been sent with deferReply()
        await interaction.editReply(answerMessage.content);

        // Putting new messages into chat history
        // * Note: user messages might (artificially) contain no value
        // * which shouldn't be considered as a valid message
        if (!!userMessage.content) {
            interaction.client.chatHistory.push(userMessage);
        }
        interaction.client.chatHistory.push(answerMessage);

        //endregion
        //region [Collecting]

        // Creating message collector to access user's inputs
        // with filtering models' answers
        const collectorFilter = m => m.author.id !== interaction.client.user.id;
        const collector = interaction.channel.createMessageCollector(
            {
                filter: collectorFilter,
                time: COLLECTOR_TIMEOUT
            }
        );

        // Replying with generated answers upon receiving a message
        collector.on('collect', async m => {
            // Resetting the timer in first place to avoid termination
            // while generating answers
            // * Note: this doesn't ensures the case when
            // * both the timeout and a message come at the exact same time :) 
            collector.resetTimer();

            // Building user's message object being accepted by model
            const message = getMessageObject(
                text=m.content,
                role=ChatRoles.USER,
                author=m.author.displayName
            );
            console.log(`[>] Collected message #${m.id}`);
            message.logMessage();

            // Requesting the local model to generate an answer
            // and sending it
            let answerMessage = await generateAnswer(
                message=message,
                instruction=REQUEST.COMPLETION,
                chatHistory=interaction.client.chatHistory
            );
            await m.channel.send(answerMessage.content);

            // Resetting the timer once again to wait for further messages
            collector.resetTimer();

            // Putting new messages into chat history
            // * Note: user messages might (artificially) contain no value
            // * which shouldn't be considered as a valid message
            if (!!message.content) {
                interaction.client.chatHistory.push(message);
            }
            interaction.client.chatHistory.push(answerMessage);

            console.log(`[<] Answered message #${m.id}`);
            answerMessage.logMessage();
        });

        // Generating final message upon timeout
        collector.on('end', async collected => {
            console.log(`[*] Collector finished. ` +
                        `${collected.size} messages were collected.`);

            // Requesting the local model to generate the final message
            // and sending it
            let finishMessage = await generateAnswer(
                message=getMessageObject(text=null, role=ChatRoles.user),
                instruction=REQUEST.FAREWELL_TIMEOUT,
                chatHistory=interaction.client.chatHistory
            );
            await interaction.channel.send(finishMessage.content);
            
            console.log(`[<] Chat finished`);
            finishMessage.logMessage();
            console.log(`[*] Final chat length: ` +
                        `${interaction.client.chatHistory.length + 1} messages.`);

            // Don't forget to clear the history (。・ω・。)
            interaction.client.chatHistory = [];
        });
        
        //endregion
    }
};
//endregion