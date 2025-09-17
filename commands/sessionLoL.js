const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const riotId = interaction.options.getString('riotid'); // attendre [Pseudo]#[Tag]
    const riotApiKey = process.env.RIOT_API_KEY;

    const hashIndex = riotId.lastIndexOf('#');
    if (hashIndex === -1) {
        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Erreur')
                    .setDescription('Format invalide. Utilisez [Pseudo]#[Tag]')
                    .setColor('#FF0000')
            ]
        });
    }

    const name = riotId.slice(0, hashIndex).trim();
    const tag = riotId.slice(hashIndex + 1).trim();

    try {
        // Récupérer PUUID
        const summonerResponse = await axios.get(
            `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const puuid = summonerResponse.data.puuid;

        // Récupérer les 5 dernières parties (Solo/Duo)
        const matchResponse = await axios.get(
            `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const matches = matchResponse.data;

        if (!matches.length) {
            const embed = new EmbedBuilder()
                .setTitle('Session LoL')
                .setDescription(`Pas de session en cours pour ${name}#${tag}`)
                .setColor('#FF0000');
            return interaction.editReply({ embeds: [embed] });
        }

        let wins = 0, losses = 0;
        for (const matchId of matches) {
            const matchDetails = await axios.get(
                `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}`,
                { headers: { 'X-Riot-Token': riotApiKey } }
            );
            const participant = matchDetails.data.info.participants.find(p => p.puuid === puuid);
            if (participant.win) wins++;
            else losses++;
        }

        const winrate = ((wins / (wins + losses)) * 100).toFixed(2);
        const embed = new EmbedBuilder()
            .setTitle('Session LoL')
            .setDescription(`${name}#${tag} : ${winrate}% (${wins} victoires / ${losses} défaites)`)
            .setColor('#00FF00');

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error('Erreur sessionLoL:', error.response?.data || error.message);
        const embed = new EmbedBuilder()
            .setTitle('Erreur')
            .setDescription(`Impossible de trouver ${name}#${tag}. Vérifiez le pseudo et le tag exact.`)
            .setColor('#FF0000');
        await interaction.editReply({ embeds: [embed] });
    }
};
