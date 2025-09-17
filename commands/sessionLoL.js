const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const region = interaction.options.getString('region').toLowerCase();
    const riotApiKey = process.env.RIOT_API_KEY;

    try {
        const summonerResp = await axios.get(
            `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(pseudo)}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const summoner = summonerResp.data;

        // Récupérer les 5 dernières parties Solo/Duo
        const matchListResp = await axios.get(
            `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${summoner.puuid}/ids?start=0&count=5`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const matches = matchListResp.data;

        if (!matches.length) {
            return interaction.editReply(`Pas de parties récentes trouvées pour ${pseudo} sur ${region.toUpperCase()}.`);
        }

        let wins = 0;
        for (const matchId of matches) {
            const matchResp = await axios.get(
                `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
                { headers: { 'X-Riot-Token': riotApiKey } }
            );
            const participant = matchResp.data.info.participants.find(p => p.puuid === summoner.puuid);
            if (participant?.win) wins++;
        }

        const winrate = ((wins / matches.length) * 100).toFixed(2);
        const embed = new EmbedBuilder()
            .setTitle(`Session LoL de ${pseudo} sur ${region.toUpperCase()}`)
            .setDescription(`Winrate des ${matches.length} dernières parties : ${winrate}% (${wins}V/${matches.length - wins}D)`)
            .setColor('#00FF00');

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Erreur sessionLoL:', error.response?.data || error.message);
        await interaction.editReply(
            `Impossible de trouver ${pseudo} sur la région ${region.toUpperCase()}.\nVérifiez le pseudo et la région.`
        );
    }
};
