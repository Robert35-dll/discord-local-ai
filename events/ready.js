// The standard event triggered once upon client's login.

const { Events } = require('discord.js');

module.exports = {
    // * The distinction between `client: Client<boolean>` and
    // * `readyClient: Client<true>` is important for TypeScript developers
    // * since it makes some properties non-nullable
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready! Logged in as ${client.user.tag}`);
    }
};