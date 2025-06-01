import path from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";

export function loadDataFromFile<T>(path: string): T {
    try {
        return JSON.parse(readFileSync(path, 'utf-8')) as T;
    } catch (error) {
        console.error('Error reading or parsing JSON file:', error);
        process.exit(1);
    }
}

export function writeFileCreatePath(filePath: string, data: string) {
    const dir = path.dirname(filePath);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    writeFileSync(filePath, data);
}

export function filterTachiGameVersions(versions: string[]) {
    // Filter out non-numeric versions which are either INFINITAS or non vanilla versions
    return versions.filter((version) => !Number.isNaN(Number(version)));
}

export function selectInGameID(ids: number[]) {
    // In case there are multiple game ids :
    // Exclude INFINITAS song IDs and take the max ID (lower is most probably omnimix INFINITAS song) 
    return Math.max(...ids.filter((id) => id < 80000));
}