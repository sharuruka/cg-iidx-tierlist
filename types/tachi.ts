export interface TachiSong {
    artist: string;
    id: number;
    title: string;
}

export interface TachiTier {
    text: string;
    value: number;
}

export interface TachiChart {
    data: {
        inGameID: number | number[];
        dpTier?: TachiTier;
        ncTier?: TachiTier;
        hcTier?: TachiTier;
        exhcTier?: TachiTier;
    }
    playtype: "DP" | "SP";
    songID: number;
    versions: string[];
}
