const axios = require('axios');
require('dotenv').config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;
const ACCOUNT_ROUTE = 'https://europe.api.riotgames.com';
const PLATFORM_ROUTE = 'https://euw1.api.riotgames.com';

async function test() {
    try {
        const accountRes = await axios.get(
            'https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/GLX%20Jsaipo/GLX',
            { headers: { 'X-Riot-Token': RIOT_API_KEY } }
        );
        const puuid = accountRes.data.puuid;
        const gameName = accountRes.data.gameName;
        const tagLine = accountRes.data.tagLine;
        console.log(`✅ PUUID de ${gameName}#${tagLine} : ${puuid}`);

        const summonerRes = await axios.get(
            `${PLATFORM_ROUTE}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(gameName)}`,
            { headers: { 'X-Riot-Token': RIOT_API_KEY } }
        );
        const encryptedSummonerId = summonerRes.data.id;

        console.log(`🔑 EncryptedSummonerId : ${encryptedSummonerId}`);

        const leagueRes = await axios.get(
            `${PLATFORM_ROUTE}/lol/league/v4/entries/by-summoner/${encodeURIComponent(encryptedSummonerId)}`,
            { headers: { 'X-Riot-Token': RIOT_API_KEY } }
        );
        const entries = leagueRes.data;

        const solo = entries.find(e => e.queueType === 'RANKED_SOLO_5x5') || null;
        const flex = entries.find(e => e.queueType === 'RANKED_FLEX_SR') || null;

        if (solo) console.log(`🎯 SoloQ : ${solo.tier} ${solo.rank} (${solo.leaguePoints} LP) - ${solo.wins}V/${solo.losses}D`);
        else console.log('🎯 SoloQ : Non classé');

        if (flex) console.log(`🤝 Flex : ${flex.tier} ${flex.rank} (${flex.leaguePoints} LP) - ${flex.wins}V/${flex.losses}D`);
        else console.log('🤝 Flex : Non classé');

    } catch (err) {
        console.error('❌ Erreur Riot :', err.response?.data || err.message);
    }
}

test();
