const { EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = async (interaction) => {
    await interaction.deferReply();

    const riotId = interaction.options.getString('riot_id'); // format: Pseudo#Tag
    if (!riotId.includes('#')) {
        return interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Erreur')
                    .setDescription('Format invalide. Utilisez [Pseudo]#[Tag]')
                    .setColor('#FF0000')
            ]
        });
    }

    const [pseudo, tag] = riotId.split('#');

    try {
        // Exemple de requ�te OP.GG (pseudo + tag)
        const response = await axios.get(`https://na.op.gg/summoner/userName=${encodeURIComponent(pseudo)}`);
        // TODO: parser les infos de l'HTML ou utiliser une vraie API si disponible

        const embed = new EmbedBuilder()
            .setTitle(`Session LoL de ${pseudo}#${tag}`)
            .setDescription('Winrate / Stats exemple')
            .setColor('#00FF00');

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Erreur')
                    .setDescription(`Impossible de trouver ${riotId}. V�rifiez le pseudo et le tag exact.`)
                    .setColor('#FF0000')
            ]
        });
    }
};
