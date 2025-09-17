require('dotenv').config();

const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

client.once('ready', async () => {
    const CLIENT_ID = client.user.id; // Remplacez par votre client ID si besoin
    const rest = new REST().setToken('VOTRE_TOKEN_BOT'); // Remplacez par votre token

    try {
        await rest.put(Routes.applicationCommands(CLIENT_ID), {
            body: client.commands.map(command => command.data.toJSON()),
        });
        console.log('Commandes slash enregistrées !');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'Erreur lors de l\'exécution de la commande !', ephemeral: true });
    }
});

client.login(process.env.DISCORD_TOKEN);