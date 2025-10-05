/**
 * An enum of valid roles used for generating chat completions.
 * @enum { string }
 */
const ChatRoles = Object.freeze({
    SYSTEM: 'system',
    USER: 'user',
    ASSISTANT: 'assistant',
    TOOL: 'tool'
});

/**
 * An enum of valid prompts' placeholders to insert custom values.
 * @enum { string }
 */
const PromptPlaceholders = Object.freeze({
    USER: '<user>',
    ASSISTANT: '<assistant>',
    MESSAGE: '<message>'
});

/**
 * A class represents chat messages used for providing context information
 * to a certain model using Ollama API.
 */
class MessageObject {
    /**
     * Creates a new message object with general information about it.
     * @param { string | number | object } content - The content of the message.
     * @param { ChatRoles } [role=ChatRoles.SYSTEM] - The role of the message's
     *                                                author.
     * @param { string } [author=undefined] - The name of the message's author.
     */
    constructor(content, role = ChatRoles.SYSTEM, author = undefined) {
        if (typeof content === 'undefined') {
            throw TypeError('content of a \`MessageObject\` must be ' +
                            `a string, number or object but ` +
                            `${typeof content} was given.`);
        }

        // Turning content into a string (including null values)
        let messageContent = JSON.stringify(value=content, space=2);

        // If the message is signed as one from a user and has some content
        if (!!author && !!content && role === ChatRoles.USER) {
            // Formatting the content for better model prompting
            this.content = `${author} wrote: ${messageContent}`;
            this.substitutePlaceholders(PromptPlaceholders.USER, author);
        }

        this.role = role;
        this.author = author;
    }
    
    /**
     * Replaces given placeholders in stored content with the `exchangeValue`.
     * If `exchangeValue` isn't specified, removes the `placeholder`.
     * @param { PromptPlaceholders } placeholder - The placeholder to substitute.
     * @param { string | object } [exchangeValue=''] - The value to substitute with.
     */
    substitutePlaceholders(placeholder, exchangeValue = '') {
        if (!!this.content) {
            console.warn('[!] Cannot substitute placeholders in \`null\` content.');
            return;
        }
        if (!PromptPlaceholders.keys().includes(placeholder)) {
            console.warn(`[!] Cannot substitute undefined placeholder ` +
                         `\`${placeholder}\`.`);
            return;
        }

        this.content = this.content.replace(placeholder, exchangeValue);
    }

    /**
     * Prints the message to the console.
     */
    logMessage() {
        console.log(`|- [${this.role}]: ${this.content} (by ${this.author})`);
    }
}

module.exports = { ChatRoles, PromptPlaceholders, MessageObject };