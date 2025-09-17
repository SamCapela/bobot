const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const riotId = interaction.options.getString('riot_id'); // Format attendu : Pseudo#Tag
    if (!riotId || !riotId.includes('#')) {
        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Erreur')
                    .setDescription('Format invalide. Utilisez [Pseudo]#[Tag]')
                    .setColor('#FF0000')
            ]
        });
    }

    const hashIndex = riotId.lastIndexOf('#');
    const pseudo = riotId.slice(0, hashIndex);
    const tag = riotId.slice(hashIndex + 1);

    const riotApiKey = process.env.RIOT_API_KEY;

    try {
        // Récupérer le PUUID
        const summonerResp = await axios.get(
            `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(pseudo)}/${encodeURIComponent(tag)}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const puuid = summonerResp.data.puuid;

        // Récupérer le summonerId
        const summonerDetails = await axios.get(
            `https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const summonerId = summonerDetails.data.id;

        // Récupérer le rang Solo/Duo
        const rankResp = await axios.get(
            `https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const soloDuo = rankResp.data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
        const rank = soloDuo ? `${soloDuo.tier} ${soloDuo.rank}` : 'Non classé';
        const winrate = soloDuo ? ((soloDuo.wins / (soloDuo.wins + soloDuo.losses)) * 100).toFixed(2) : 'N/A';

        const embed = new EmbedBuilder()
            .setTitle(`Rang de ${pseudo}#${tag}`)
            .addFields(
                { name: 'Rang Solo/Duo', value: rank, inline: true },
                { name: 'Winrate Solo/Duo', value: `${winrate}%`, inline: true }
            )
            .setColor('#FFD700');

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        console.error('Erreur rankLoL:', err.response?.data || err.message);
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Erreur')
                    .setDescription(`Impossible de trouver ${pseudo}#${tag}. Vérifiez le pseudo et le tag exact.`)
                    .setColor('#FF0000')
            ]
        });
    }
};
