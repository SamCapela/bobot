const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const pseudo = interaction.options.getString('pseudo');
    const tag = interaction.options.getString('gamertag');

    if (!pseudo || !tag) {
        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Erreur')
                    .setDescription('Format invalide. Utilisez [Pseudo] + [Tag]')
                    .setColor('#FF0000')
            ]
        });
    }

    try {
        // Construire URL OP.GG
        const username = encodeURIComponent(`${pseudo}`);
        const opggUrl = `https://euw.op.gg/summoner/userName=${username}`;

        // Récupérer le HTML
        const response = await axios.get(opggUrl);
        const html = response.data;

        // Vérifier si le joueur existe
        if (html.includes('Summoner Not Found')) {
            throw new Error('Utilisateur introuvable');
        }

        // Parser les infos (simplifié)
        const rankMatch = html.match(/<div class="TierRank">([\s\S]*?)<\/div>/);
        const lpMatch = html.match(/<span class="LeaguePoints">([\s\S]*?)<\/span>/);
        const winrateMatch = html.match(/<span class="winratio">([\s\S]*?)<\/span>/);

        const rank = rankMatch ? rankMatch[1].trim() : 'Non classé';
        const lp = lpMatch ? lpMatch[1].trim() : 'N/A';
        const winrate = winrateMatch ? winrateMatch[1].trim() : 'N/A';

        const embed = new EmbedBuilder()
            .setTitle(`Rang de ${pseudo}#${tag}`)
            .addFields(
                { name: 'Rang Solo/Duo', value: rank, inline: true },
                { name: 'Points de ligue', value: lp, inline: true },
                { name: 'Winrate', value: winrate, inline: true }
            )
            .setColor('#FFD700')
            .setThumbnail('https://opgg-static.akamaized.net/images/medals/default/0_1.png');

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Erreur')
                    .setDescription(`Impossible de trouver ${pseudo}#${tag}. Vérifiez le pseudo et le tag exact.`)
                    .setColor('#FF0000')
            ]
        });
        console.error('Erreur rankLoL:', error.message);
    }
};
