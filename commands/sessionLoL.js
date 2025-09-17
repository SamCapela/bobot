const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const riotId = interaction.options.getString('riot_id'); // Format : Pseudo#Tag
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
        const summonerResp = await axios.get(
            `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(pseudo)}/${encodeURIComponent(tag)}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const puuid = summonerResp.data.puuid;

        // Récupérer les 5 dernières parties
        const matchResp = await axios.get(
            `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const matches = matchResp.data;

        if (!matches.length) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Session LoL')
                        .setDescription(`Pas de session en cours pour ${pseudo}#${tag}`)
                        .setColor('#FF0000')
                ]
            });
        }

        let wins = 0, losses = 0;
        for (const matchId of matches) {
            const matchDetails = await axios.get(
                `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}`,
                { headers: { 'X-Riot-Token': riotApiKey } }
            );
            const participant = matchDetails.data.info.participants.find(p => p.puuid === puuid);
            if (participant.win) wins++; else losses++;
        }

        const winrate = ((wins / (wins + losses)) * 100).toFixed(2);

        const embed = new EmbedBuilder()
            .setTitle('Session LoL')
            .setDescription(`${pseudo}#${tag} : ${winrate}% (${wins} victoires / ${losses} défaites)`)
            .setColor('#00FF00');

        await interaction.editReply({ embeds: [embed] });
    } catch (err) {
        console.error('Erreur sessionLoL:', err.response?.data || err.message);
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
