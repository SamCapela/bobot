require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const axios = require('axios');

// Intents s�rs pour Render
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        // GatewayIntentBits.MessageContent retir� pour �viter l'erreur disallowed intents
    ],
});

// Commandes corrig�es avec pseudo + region
const commands = [
    {
        name: 'invitelol',
        description: 'Cr�e une invitation pour rejoindre un lobby League of Legends.',
    },
    {
        name: 'sessionlol',
        description: 'Affiche le winrate de la session en cours.',
        options: [
            { name: 'pseudo', type: 3, description: 'Pseudo du joueur', required: true },
            { name: 'region', type: 3, description: 'R�gion du joueur (ex: euw, na, kr)', required: true },
        ],
    },
    {
        name: 'ranklol',
        description: 'Affiche le rang et les stats d\'un joueur.',
        options: [
            { name: 'pseudo', type: 3, description: 'Pseudo du joueur', required: true },
            { name: 'region', type: 3, description: 'R�gion du joueur (ex: euw, na, kr)', required: true },
        ],
    },
];

// D�ployer les commandes
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Commandes enregistr�es avec succ�s.');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des commandes:', error);
    }
})();

// �v�nement pr�t
client.once('ready', () => {
    console.log(`Connect� en tant que ${client.user.tag}`);
});

// Gestion des interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'invitelol') {
        require('./commands/inviteLoL')(interaction);
    } else if (commandName === 'sessionlol') {
        require('./commands/sessionLoL')(interaction);
    } else if (commandName === 'ranklol') {
        require('./commands/rankLoL')(interaction);
    }
});

// Connexion du bot
client.login(process.env.DISCORD_TOKEN);
