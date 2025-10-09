if (interaction.type === 1) { // PING
    return res.status(200).json({ type: 1 });
}

await interaction.deferReply();

return res.status(200).send('Test OK');
