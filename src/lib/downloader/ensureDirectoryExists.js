import { mkdir } from 'node:fs/promises';

/**
 * Ensures a directory exists. Creates it (and any parent directories) if missing.
 * @param {string} dirPath - The relative or absolute path of the directory.
 * @returns {Promise<string|undefined>} The path of the created directory, or undefined if it existed.
 */
export async function ensureDirectoryExists(dirPath) {
    try {
        const createdPath = await mkdir(dirPath, { recursive: true });
        
        if (createdPath) {
            console.log(`✅ Created new directory: ${dirPath}`);
        } else {
            console.log(`✅ Using existing directory: ${dirPath}`);
        }
        
        return dirPath;
    } catch (error) {
        console.error(`❌ Error creating directory at ${dirPath}:`, error.message);
        throw error
    }
}