import fs from 'fs'
import path from 'node:path'

// Claude version uses fs.writeFileSync() and Buffer.from()
export async function landfireDownloadFile(href, destDir, mapName) {
    console.log(`⏳ Downloading LANDFIRE job file from '${href}' ...`)

    const res = await fetch(href)
    if (!res.ok) {
        throw new Error(`❌ Failed to download file. HTTP Status: ${res.status} ${res.statusText}`);
    }
    const buf = Buffer.from(await res.arrayBuffer())

    const baseName = path.basename(href)
    const localFile = `${destDir}/${mapName}.zip`
    console.log(`⏳ Saving LANDFIRE job file at '${localFile}' ...`)
    fs.writeFileSync(localFile, buf)
    console.log(`✅ LANDFIRE download complete! Saved ${buf.length} bytes to: ${localFile}`)
}
