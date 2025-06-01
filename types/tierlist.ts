export interface Tier {
    text: string;
    value: number;
    songs: {
        songID: number;
        songName: string;
        versions: string[];
    }[];
}

export interface TierList {
    tierListName: string;
    tiers: Tier[];
}

export interface TierListData {
    dp: TierList[];
    sp: TierList[];
}
