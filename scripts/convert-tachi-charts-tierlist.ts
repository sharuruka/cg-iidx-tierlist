import { TachiChart, TachiSong } from '../types/tachi';
import { Tier, TierList, TierListData } from '../types/tierlist';
import { loadDataFromFile, filterTachiGameVersions, selectInGameID, writeFileCreatePath } from './utils';

// Check if file path arguments are provided
if (process.argv.length < 5) {
    console.error('Usage: tsx convert-tachi-charts-tierlist.ts <tachi-charts-path> <tachi-songs-path> <output-path>');
    process.exit(1);
}

// Get the file path from command line arguments
const chartsPath = process.argv[2];
const songsPath = process.argv[3];
const outputPath = process.argv[4];

// Proper schema checking would be nice but this will do for now
const chartsData = loadDataFromFile<TachiChart[]>(chartsPath);
const songsData = loadDataFromFile<TachiSong[]>(songsPath);

// Index tachi song data by tachi song id
const songDataIndex: Record<number, TachiSong> = {};
songsData.forEach((song) => {
    songDataIndex[song.id] = song;
});

// Initialize tier lists
const tachiTierListIds = ["dpTier", "ncTier", "hcTier", "exhcTier"] as const;
const convertedTachiTiers: Record<typeof tachiTierListIds[number], Record<string, Tier>> = {
    dpTier: {},
    ncTier: {},
    hcTier: {},
    exhcTier: {}
};

// Extract tier lists from tachi charts and songs
for (const chart of chartsData) {
    const song = songDataIndex[chart.songID];
    if (!song) {
        console.error(`Song with ID ${chart.songID} not found in songs data`);
        process.exit(1);
    }

    for (const tierListId of tachiTierListIds) {
        const tierListChartData = chart.data[tierListId];
        
        if (!tierListChartData) {
            continue;
        }
        const tierText = tierListChartData.text;
        const tierValue = tierListChartData.value;
        const versions = filterTachiGameVersions(chart.versions);

        if (!versions.length) {
            continue;
        }

        if (!convertedTachiTiers[tierListId][tierText]) {
            convertedTachiTiers[tierListId][tierText] = {
                text: tierText,
                value: tierValue,
                songs: []
            }
        }
        const inGameID = Array.isArray(chart.data.inGameID)
            ? selectInGameID(chart.data.inGameID)
            : chart.data.inGameID;
        convertedTachiTiers[tierListId][tierText].songs.push({
            songID: inGameID,
            songName: song.title,
            versions: versions
        });
    }
}

// Initialize converted tachi tier lists
const convertedTachiTierLists: Record<typeof tachiTierListIds[number], TierList> = {
    dpTier: {
        tierListName: "Normal",
        tiers: []
    },
    ncTier: {
        tierListName: "Normal",
        tiers: []
    },
    hcTier: {
        tierListName: "Hard",
        tiers: []
    },
    exhcTier: {
        tierListName: "EX Hard",
        tiers: []
    }
};

// Sort and fill converted tachi tier lists
for (const tierId of tachiTierListIds) {
    for (const tier of Object.values(convertedTachiTiers[tierId])) {
        tier.songs = tier.songs.sort((a, b) => a.songName.localeCompare(b.songName));
        convertedTachiTierLists[tierId].tiers.push(tier);
    }
    convertedTachiTierLists[tierId].tiers = convertedTachiTierLists[tierId].tiers.sort((a, b) => a.value - b.value);
}

// Convert tier lists to the desired format
const tierListData: TierListData = {
    dp: [
        convertedTachiTierLists.dpTier
    ],
    sp: [
        convertedTachiTierLists.ncTier,
        convertedTachiTierLists.hcTier,
        convertedTachiTierLists.exhcTier
    ]
};

// Write the converted data to the output file
try {
    const jsonString = JSON.stringify(tierListData, null, 2);
    writeFileCreatePath(outputPath, jsonString);
    console.log(`Successfully wrote tier list data to ${outputPath}`);
} catch (error) {
    console.error('Error writing output file:', error);
}
