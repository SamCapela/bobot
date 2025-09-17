const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');

module.exports = async (interaction) => {
    await interaction.deferReply();

    // Créer une carte d'invitation
    const embed = new EmbedBuilder()
        .setTitle('Invitation au lobby League of Legends')
        .setDescription('Rejoignez le lobby pour jouer ensemble !')
        .setColor('#FF4500')
        .setThumbnail('https://cdn.discordapp.com/attachments/LoL_icon.png'); // Remplacez par une URL d'image LoL

    // Bouton "Rejoindre"
    const joinButton = new ButtonBuilder()
        .setLabel('Rejoindre')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.gg/your_invite_link'); // Remplacez par un lien vers un salon vocal ou un lien externe

    const row = new ActionRowBuilder().addComponents(joinButton);

    await interaction.editReply({ embeds: [embed], components: [row] });
};