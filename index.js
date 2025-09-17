require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// Définition des commandes slash
const commands = [
    {
        name: 'ranklol',
        description: 'Affiche les rangs Solo/Duo et Flex d\'un joueur LoL.',
        options: [
            { name: 'pseudo', type: 3, description: 'Pseudo du joueur', required: true },
            {
                name: 'region',
                type: 3,
                description: 'Région (ex: euw, na, kr)',
                required: true,
                choices: [
                    { name: 'EUW', value: 'euw1' },
                    { name: 'NA', value: 'na1' },
                    { name: 'KR', value: 'kr' },
                    { name: 'EUNE', value: 'eun1' },
                    { name: 'BR', value: 'br1' },
                    { name: 'LAN', value: 'la1' },
                    { name: 'LAS', value: 'la2' },
                    { name: 'OCE', value: 'oc1' },
                    { name: 'TR', value: 'tr1' },
                    { name: 'RU', value: 'ru' },
                    { name: 'JP', value: 'jp1' },
                ],
            },
        ],
    },
    {
        name: 'sessionlol',
        description: 'Affiche les stats des 20 dernières parties d\'un joueur LoL.',
        options: [
            { name: 'pseudo', type: 3, description: 'Pseudo du joueur', required: true },
            {
                name: 'region',
                type: 3,
                description: 'Région (ex: euw, na, kr)',
                required: true,
                choices: [
                    { name: 'EUW', value: 'euw1' },
                    { name: 'NA', value: 'na1' },
                    { name: 'KR', value: 'kr' },
                    { name: 'EUNE', value: 'eun1' },
                    { name: 'BR', value: 'br1' },
                    { name: 'LAN', value: 'la1' },
                    { name: 'LAS', value: 'la2' },
                    { name: 'OCE', value: 'oc1' },
                    { name: 'TR', value: 'tr1' },
                    { name: 'RU', value: 'ru' },
                    { name: 'JP', value: 'jp1' },
                ],
            },
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Enregistrement des commandes
(async () => {
    try {
        await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
        console.log('Commandes enregistrées avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des commandes:', error);
    }
})();

// Gestion des interactions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ranklol') {
        await require('./commands/rankLoL')(interaction);
    } else if (commandName === 'sessionlol') {
        await require('./commands/sessionLoL')(interaction);
    }
});

// Connexion du bot
client.once('ready', () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);