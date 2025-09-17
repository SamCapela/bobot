require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');

// Intents sûrs pour Render
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
});

// Commandes
const commands = [
    {
        name: 'invitelol',
        description: 'Crée une invitation pour rejoindre un lobby League of Legends.',
    },
    {
        name: 'ranklol',
        description: 'Affiche le rang d’un joueur LoL (clé dev uniquement).',
        options: [
            { name: 'pseudo', type: 3, description: 'Pseudo du joueur', required: true },
            { name: 'region', type: 3, description: 'Région du joueur (EUW, NA, etc.)', required: true },
        ],
    },
    {
        name: 'sessionlol',
        description: 'Affiche le winrate des dernières parties d’un joueur (clé dev uniquement).',
        options: [
            { name: 'pseudo', type: 3, description: 'Pseudo du joueur', required: true },
            { name: 'region', type: 3, description: 'Région du joueur (EUW, NA, etc.)', required: true },
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Commandes enregistrées avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des commandes:', error);
    }
})();

client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'invitelol') {
        require('./commands/inviteLoL')(interaction);
    } else if (commandName === 'ranklol') {
        require('./commands/rankLoL')(interaction);
    } else if (commandName === 'sessionlol') {
        require('./commands/sessionLoL')(interaction);
    }
});

client.login(process.env.DISCORD_TOKEN);
