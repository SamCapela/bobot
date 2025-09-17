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

        if (html.includes('Summoner Not Found')) {
            throw new Error('Utilisateur introuvable');
        }

        // Parser les dernières parties (simplifié)
        const recentMatch = html.match(/<span class="GameResult">([\s\S]*?)<\/span>/g) || [];
        const last5 = recentMatch.slice(0, 5).map(m => m.replace(/<[^>]*>/g, '').trim());

        const wins = last5.filter(r => r === 'Win').length;
        const losses = last5.filter(r => r === 'Loss').length;
        const winrate = last5.length ? ((wins / last5.length) * 100).toFixed(2) : 'N/A';

        const embed = new EmbedBuilder()
            .setTitle(`Session LoL de ${pseudo}#${tag}`)
            .setDescription(`${winrate}% (${wins} victoires / ${losses} défaites sur les 5 dernières parties)`)
            .setColor('#00FF00')
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
        console.error('Erreur sessionLoL:', error.message);
    }
};
