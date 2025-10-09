const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const ACCOUNT_ROUTE = 'https://europe.api.riotgames.com';
const PLATFORM_ROUTE = 'https://euw1.api.riotgames.com';

async function getPUUID(gameName, tagLine) {
    const url = `${ACCOUNT_ROUTE}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const res = await axios.get(url, { headers: { 'X-Riot-Token': RIOT_API_KEY } });
    return res.data.puuid;
}

async function getRanks(puuid) {
    const url = `${PLATFORM_ROUTE}/lol/league/v4/entries/by-puuid/${encodeURIComponent(puuid)}`;
    const res = await axios.get(url, { headers: { 'X-Riot-Token': RIOT_API_KEY } });
    const entries = res.data;
    return {
        solo: entries.find(e => e.queueType === 'RANKED_SOLO_5x5') || null,
        flex: entries.find(e => e.queueType === 'RANKED_FLEX_SR') || null
    };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Affiche le rang SoloQ et Flex d’un joueur')
        .addStringOption(option =>
            option.setName('pseudo')
                .setDescription('Pseudo du joueur (gameName)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tag')
                .setDescription('Tag du joueur (tagLine)')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const pseudo = interaction.options.getString('pseudo');
        const tag = interaction.options.getString('tag');

        try {
            const puuid = await getPUUID(pseudo, tag);
            const ranks = await getRanks(puuid);

            const embed = new EmbedBuilder()
                .setTitle(`Rangs de ${pseudo}#${tag}`)
                .setColor(0x1f8b4c)
                .setDescription('=======================')
                .setTimestamp()
                .setFooter({ text: 'Données fournies par Riot API' });

            if (ranks.solo) {
                embed.addFields({ name: 'SoloQ', value: `${ranks.solo.tier} ${ranks.solo.rank} (${ranks.solo.leaguePoints} LP) : ${ranks.solo.wins}V - ${ranks.solo.losses}D`, inline: false });
            } else {
                embed.addFields({ name: 'SoloQ', value: 'Non classé', inline: false });
            }

            embed.addFields({ name: '=======================', value: '\u200B', inline: false });

            if (ranks.flex) {
                embed.addFields({ name: 'Flex', value: `${ranks.flex.tier} ${ranks.flex.rank} (${ranks.flex.leaguePoints} LP) : ${ranks.flex.wins}V - ${ranks.flex.losses}D`, inline: false });
            } else {
                embed.addFields({ name: 'Flex', value: 'Non classé', inline: false });
            }

            embed.addFields({ name: '=======================', value: '\u200B', inline: false });

            await interaction.editReply({ embeds: [embed] });

        } catch (err) {
            console.error(err.response?.data || err.message);
            await interaction.editReply('❌ Erreur lors de la récupération des données Riot. Vérifie le pseudo et le tag.');
        }
    },
};
