import { writeFileCreatePath } from "./utils";

if (process.argv.length < 4) {
    console.error('Usage: tsx fetch-file.ts <url> <output-path>');
    process.exit(1);
}

const url = process.argv[2];
const outputPath = process.argv[3];

const fileContent = await (await fetch(url)).text();

try {
    writeFileCreatePath(outputPath, fileContent);
    console.log(`Successfully fetched file from ${url} and wrote to ${outputPath}`);
} catch (error) {
    console.error('Error writing output file:', error);
}
