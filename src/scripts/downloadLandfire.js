/**
 * downloadLandfire.js
 *  1 - Submits a request to the LANDFIRE Product Service (LFPS)
 *      for a set of fire behavior layers within a geographical bounding box;
 *  2 - Polls the LFPS until the requested layers are constructed and available;
 *  3 - Downloads the zip file containing the multi-band GeoTIFF and supporting files
 *      onto a local directory;
 *  4 - Unzips the downloaded file into project-named files.
 */
// Requires Node 18+ (uses native fetch)
// Requires Install: npm install geotiff
// Run: node getLandfire

import { describeGeoTiff } from './index.js'
import { ensureDirectoryExists } from './index.js'
import { landfireSubmitRequest } from './index.js'
import { landfirePollStatus } from './index.js'
import { landfireDownloadFile } from './index.js'
import { landfireReadAuxFile } from './index.js'
import { landfireUnzipDownloadFile } from './index.js'
import { landfireConvertGeoTiffToAscii } from './index.js'

async function downloadLandfire(mapName, bbox, topDownloadDir='./landfireData') {
    const start = new Date()
    const params = {
        'Area_of_Interest': 19,
        // 'Area_of_Interest': `${bbox.west} ${bbox.south} ${bbox.east} ${bbox.north}`,
        'Layer_List': 'LF2020_Elev;LF2020_SlpD;LF2020_Asp;LF2025_FBFM40;LF2025_CC;LF2025_CH;LF2025_CBH;LF2025_CBD',
        'Email': 'cbevins@montana.com',
        'Include_Layer_List_XML_File': true,   // TRUE totally changes the XML file!
        // 'Output_Projection': 6414,
        // 'Resample_Resolution': 90,
        // 'Edit_Rule': {"edit":[{"condition":[{"product":"LF2020_Elev","operator":"lt","value":500}],"change":[{"product":"LF2023_FBFM40","operator":"st","value":181},{"product":"LF2023_CBH","operator":"ib","value":5}]}]},
    }
    const mapDir = `${topDownloadDir}/${mapName}`
    const mapZipFullPath = mapDir + `/${mapName}.zip`
    const mapTifFullPath = mapDir  + `/${mapName}.tif`
    const mapAuxFullPath = mapDir  + `/${mapName}.tif.aux.xml`

    console.clear()
    console.log(`\n\nLANDFIRE Request for '${mapName}' on ${new Date()}`)
    
    await ensureDirectoryExists(mapDir)
    const jobId = await landfireSubmitRequest(params)
    const status = await landfirePollStatus(jobId)
    await landfireDownloadFile(status.outputFile, mapDir, mapName)
    await landfireUnzipDownloadFile(mapZipFullPath, mapDir, mapName)
    // -----   await describeGeoTiff(mapTifFullPath)
    const auxJson = landfireReadAuxFile(mapAuxFullPath)
    // console.log(auxJson)
    await landfireConvertGeoTiffToAscii(mapTifFullPath, mapDir, auxJson)
    const stop = new Date()
    console.log(`Elapsed time = ${stop-start} msec`)
}

const CouncilGrove = {west: -114.25, south: 46.78, east: -114.10, north: 46.93}

// const MtSentinnel = {west: -113.983, south: 46.825, east: -113.950, north: 46.865}
// await downloadLandfire('MtSentinnel', MtSentinnel, '../downloads')

// Bbox centered at lat 47 lon -114 plus/minus 0.01 degree
// const AOI_47_114_01 = {west: -114.01, south: 46.99, east: -113.99, north: 47.01}
// await downloadLandfire('AOI_47_114_01', AOI_47_114_01, '../downloads')

// Bbox centered at lat 47 lon -114 plus/minus 0.1 degree
// const AOI_47_114_1 = {west: -114.1, south: 46.9, east: -113.9, north: 47.1}
// await downloadLandfire('AOI_47_114_1', AOI_47_114_1, '../downloads')

// Bbox centered at lat 47 lon -114 plus/minus 0.5 degree
// const AOI_47_114_5 = {west: -114.5, south: 46.5, east: -113.5, north: 47.5}
// await downloadLandfire('AOI_47_114_5', AOI_47_114_5, '../downloads')

// LANDFITE Map Zone 19
// const MAP_19 = 19
// await downloadLandfire('MAP_19', MAP_19, '../downloads')
