require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');

// Intents s�rs pour Render
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
    ],
});

// Commandes
const commands = [
    {
        name: 'invitelol',
        description: 'Cr�e une invitation pour rejoindre un lobby League of Legends.',
    },
    {
        name: 'ranklol',
        description: 'Affiche le rang d�un joueur LoL (cl� dev uniquement).',
        options: [
            { name: 'pseudo', type: 3, description: 'Pseudo du joueur', required: true },
            { name: 'region', type: 3, description: 'R�gion du joueur (EUW, NA, etc.)', required: true },
        ],
    },
    {
        name: 'sessionlol',
        description: 'Affiche le winrate des derni�res parties d�un joueur (cl� dev uniquement).',
        options: [
            { name: 'pseudo', type: 3, description: 'Pseudo du joueur', required: true },
            { name: 'region', type: 3, description: 'R�gion du joueur (EUW, NA, etc.)', required: true },
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Commandes enregistr�es avec succ�s.');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des commandes:', error);
    }
})();

client.once('ready', () => {
    console.log(`Connect� en tant que ${client.user.tag}`);
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
