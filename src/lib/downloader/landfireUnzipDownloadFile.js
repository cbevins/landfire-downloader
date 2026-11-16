import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readdir, rename } from 'node:fs/promises';
import path from 'node:path'
import AdmZip from 'adm-zip'

export async function landfireUnzipDownloadFile(zipFile, mapDir, mapName) {
    console.log(`Extracting files from ${zipFile} ...`)
    const zip = new AdmZip(zipFile)

    // Query entries without extracting
    const zipEntries = zip.getEntries()
    // There is only 1 *.tif file; find its base name
    let zipName = ''
    zipEntries.forEach((entry) => {
        const parts = entry.entryName.split('.')
        if (parts.length>1 && parts[1] === 'tif')
            zipName = parts[0]
    })
    // console.log(`ZIP File Base Name is '${zipName}'`)

    const doRename =[]
    zipEntries.forEach((entry) => {
        // Rename files with the zip name to the map name
        const parts = entry.entryName.split('.')
        if (parts[0] === zipName) {
            parts[0] = mapName
            const outName = parts.join('.')
            doRename.push({from: entry.entryName, to: outName})
        }
        console.log(`    -> '${entry.entryName}' ...`)
        zip.extractEntryTo(entry, mapDir,
            false, // Set to false to extract directly into outputDir without preserving internal folder hierarchy
            true   // Overwrite existing files
        );
    })

    console.log('Renaming files ...')
    for(let item of doRename) {
        const {from, to} = item
        console.log(`  ${from} -> ${to} ...`)    
        await rename(path.join(mapDir, from), path.join(mapDir, to))
    }
    return zipEntries
}

// const execAsync = promisify(exec);

// /**
//  * Extracts a zip archive and renames the extracted files with a new base name.
//  * @param {string} zipFilePath - Path to the zip file.
//  * @param {string} extractToDir - Target directory for extracted contents.
//  * @param {string} newBaseName - The new prefix/base name for the extracted files.
//  */
// export async function landfireUnzipDownloadFile(zipFilePath, extractToDir, newBaseName) {
//     console.log(`🚀 Extracting ${zipFilePath} to ${extractToDir} as '${newBaseName}' ...`)

//     await mkdir(extractToDir, { recursive: true })

//     // Cross-platform extraction command
//     const isWindows = process.platform === 'win32'
//     const command = isWindows
//         ? `powershell -Command "Expand-Archive -Path '${zipFilePath}' -DestinationPath '${extractToDir}' -Force"`
//         : `unzip -o "${zipFilePath}" -d "${extractToDir}"`

//     try {
//         await execAsync(command)
//         // console.log(`✅ Extraction complete! Renaming files to base name: "${newBaseName}"...`);

//         // Read extracted files
//         const files = await readdir(extractToDir)

//         for (const file of files) {
//             const oldPath = path.join(extractToDir, file)
//             const fileExtension = path.extname(file)
//             // Construct new file name (e.g., custom_name.ext or custom_name_1.ext if multiple)
//             const newFileName = `${newBaseName}${fileExtension}`
//             const newPath = path.join(extractToDir, newFileName)

//             await rename(oldPath, newPath)
//             console.log(`  ✅ Renamed: ${file} ➔  ${newFileName}`)
//         }

//         console.log('✅ All files renamed successfully!')
//     } catch (error) {
//         throw new Error(`❌ Failed during extraction or renaming: ${error.message}`)
//     }
// }