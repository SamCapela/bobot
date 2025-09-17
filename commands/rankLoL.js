const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const puppeteer = require('puppeteer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranklol')
    .setDescription('Récupère le rang SoloQ et Flex d\'un joueur LoL via tracker.gg')
    .addStringOption(option =>
      option.setName('pseudo')
        .setDescription('Pseudo du joueur (ex: GLX Jsaipo)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('tag')
        .setDescription('Tag du joueur (ex: GLX)')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply(); // Pour éviter le timeout si le scraping est lent

    const pseudo = interaction.options.getString('pseudo');
    const tag = interaction.options.getTag('tag');
    const fullName = `${pseudo}#${tag}`;
    const encodedName = encodeURIComponent(fullName); // Encode pour l'URL : espaces -> %20, # reste
    const url = `https://tracker.gg/lol/profile/riot/${encodedName}/overview`;

    let browser;
    try {
      browser = await puppeteer.launch({ headless: true }); // headless: false pour debug visuel
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle2' }); // Attend que la page charge

      // Attendre que les éléments des rangs soient chargés (ajustez le sélecteur si besoin)
      await page.waitForSelector('.ranked-queues__item', { timeout: 10000 });

      // Extraire SoloQ (Ranked Solo/Duo) - Ajustez le sélecteur basé sur l'inspection HTML de tracker.gg
      const soloQElement = await page.evaluate(() => {
        const soloQueue = Array.from(document.querySelectorAll('.ranked-queues__item')).find(el => 
          el.textContent.includes('Solo/Duo') || el.textContent.includes('SoloQ')
        );
        return soloQueue ? soloQueue.querySelector('.ranked-tier')?.textContent.trim() || 'Non trouvé' : 'Non trouvé';
      });

      // Extraire Flex (Ranked Flex) - Similaire, ajustez
      const flexElement = await page.evaluate(() => {
        const flexQueue = Array.from(document.querySelectorAll('.ranked-queues__item')).find(el => 
          el.textContent.includes('Flex') || el.textContent.includes('Flex 5v5')
        );
        return flexQueue ? flexQueue.querySelector('.ranked-tier')?.textContent.trim() || 'Non trouvé' : 'Non trouvé';
      });

      await browser.close();

      // Créer un embed pour la réponse
      const embed = new EmbedBuilder()
        .setTitle(`Rangs de ${fullName}`)
        .setColor(0x00FF00)
        .addFields(
          { name: 'SoloQ (Ranked Solo/Duo)', value: soloQElement || 'Non classé', inline: true },
          { name: 'Flex (Ranked Flex)', value: flexElement || 'Non classé', inline: true }
        )
        .setThumbnail('https://tracker.gg/lol/favicon-32x32.png') // Icône optionnelle
        .setFooter({ text: 'Données scrapées depuis tracker.gg' });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Erreur scraping:', error);
      if (browser) await browser.close();
      await interaction.editReply({ content: `Erreur lors de la récupération des données pour ${fullName}. Vérifiez le pseudo/tag ou réessayez plus tard. (Détails: ${error.message})` });
    }
  },
};