const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    let gamertag = interaction.options.getString('gamertag');
    gamertag = gamertag.replace('#', '');
    const riotApiKey = process.env.RIOT_API_KEY;

    console.log(`Vérification session pour: pseudo="${pseudo}", tag="${gamertag}"`);

    try {
        // Étape 1 : Récupérer le PUUID
        const summonerResponse = await axios.get(
            `https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(pseudo)}/${encodeURIComponent(gamertag)}`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const puuid = summonerResponse.data.puuid;

        // Étape 2 : Récupérer les 5 dernières parties
        const matchResponse = await axios.get(
            `https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=5`,
            { headers: { 'X-Riot-Token': riotApiKey } }
        );
        const matches = matchResponse.data;

        if (!matches.length) {
            const embed = new EmbedBuilder()
                .setTitle('Session LoL')
                .setDescription(`Pas de session en cours pour ${pseudo}#${gamertag}`)
                .setColor('#FF0000');
            return interaction.editReply({ embeds: [embed] });
        }

        // Étape 3 : Calcul du winrate
        let wins = 0, losses = 0;
        for (const matchId of matches) {
            const matchDetails = await axios.get(
                `https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}`,
                { headers: { 'X-Riot-Token': riotApiKey } }
            );
            const participant = matchDetails.data.info.participants.find(p => p.puuid === puuid);
            if (!participant) continue;
            if (participant.win) wins++;
            else losses++;
        }

        const winrate = ((wins / (wins + losses)) * 100).toFixed(2);
        const embed = new EmbedBuilder()
            .setTitle('Session LoL')
            .setDescription(`${pseudo}#${gamertag} : ${winrate}% (${wins} victoires / ${losses} défaites)`)
            .setColor('#00FF00')
            .setThumbnail('https://cdn.discordapp.com/attachments/LoL_icon.png');

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error(error.response?.data || error.message);
        const embed = new EmbedBuilder()
            .setTitle('Erreur')
            .setDescription(`Impossible de trouver ${pseudo}#${gamertag}. Vérifiez le pseudo et le tag exact (chiffres après #).`)
            .setColor('#FF0000');
        await interaction.editReply({ embeds: [embed] });
    }
};
