import { Eta } from "eta";
import { readFileSync } from "fs";

import { TierListData } from "../types/tierlist";
import { loadDataFromFile, writeFileCreatePath } from "./utils";

// Check if file path arguments are provided
if (process.argv.length < 6) {
    console.error('Usage: tsx build-userscript.ts <version> <userscript-template-path> <tierlist-path> <output-path>');
    process.exit(1);
}

// Get the file path from command line arguments
const version = process.argv[2];
const userscriptTemplatePath = process.argv[3];
const tierlistPath = process.argv[4];
const outputPath = process.argv[5];

// Load tierlist data
const tierlistData = loadDataFromFile<TierListData>(tierlistPath);

const minifiedTierlistData = JSON.stringify(tierlistData);

// Load userscript template
const userscriptTemplate = readFileSync(userscriptTemplatePath, 'utf-8');

const eta = new Eta({
    autoEscape: false,
    autoTrim: false
});
eta.loadTemplate("@userscript", userscriptTemplate);

// Render the userscript
const userscript = eta.render("@userscript", {
    tierlistObject: minifiedTierlistData,
    version
});

// Write the userscript to the output path
try {
    writeFileCreatePath(outputPath, userscript);
    console.log(`Successfully wrote userscript to ${outputPath}`);
} catch (error) {
    console.error('Error writing output file:', error);
}
