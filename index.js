require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');

// Intents sûrs pour Render
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ],
});

// Commandes avec deux champs : pseudo + tag
const commands = [
    {
        name: 'invitelol',
        description: 'Crée une invitation pour rejoindre un lobby League of Legends.',
    },
    {
        name: 'sessionlol',
        description: 'Affiche le winrate de la session en cours.',
        options: [
            { name: 'pseudo', type: 3, description: 'Pseudo du joueur', required: true },
            { name: 'tag', type: 3, description: 'Tag après #', required: true },
        ],
    },
    {
        name: 'ranklol',
        description: 'Affiche le rang et les stats d\'un joueur.',
        options: [
            { name: 'pseudo', type: 3, description: 'Pseudo du joueur', required: true },
            { name: 'tag', type: 3, description: 'Tag après #', required: true },
        ],
    },
];

// Déployer les commandes
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(async () => {
    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Commandes enregistrées avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des commandes:', error);
    }
})();

// Événement prêt
client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
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
