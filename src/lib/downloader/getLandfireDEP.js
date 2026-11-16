// getLandfire.js
// Node 18+ (uses native fetch)
// Install: npm install geotiff
// Run: node getLandfire

import { landfireSubmitRequest } from './landfireSubmitRequest.js'
import { landfirePollStatus } from './lib/landfirePollStatus.js'
import { landfireDownloadFile } from './lib/landfireDownloadFile.js'
import { landfireUnzipDownloadFile } from './lib/landfireUnzipDownloadFile.js'
import { ensureDirectoryExists } from './lib/ensureDirectoryExists.js'
import { describeGeoTIFF } from './lib/describeGeoTiff.js'
import { landfireReadXmlFile } from './lib/landfireReadXmlFile.js'
import { landfireConvertGeoTiffToAscii } from './lib/landfireConvertGeoTiffToAscii.js'

async function getLandfire(mapName, bbox, topDownloadDir='./downloads') {
    const params = {
        'Area_of_Interest': `${bbox.west} ${bbox.south} ${bbox.east} ${bbox.north}`,
        'Layer_List': 'LF2020_Elev;LF2020_SlpD;LF2020_Asp;LF2023_FBFM40;LF2023_CC;LF2023_CH;LF2023_CBH;LF2023_CBD',
        'Email': 'cbevins@montana.com',
        'Include_Layer_List_XML_File': false,   // TRUE totally changes the XML file!
        // 'Output_Projection': 6414,
        // 'Resample_Resolution': 90,
        // 'Edit_Rule': {"edit":[{"condition":[{"product":"LF2020_Elev","operator":"lt","value":500}],"change":[{"product":"LF2023_FBFM40","operator":"st","value":181},{"product":"LF2023_CBH","operator":"ib","value":5}]}]},
    }
    const downloadDir = `${topDownloadDir}/${mapName}`
    const downloadZip = downloadDir + `/${mapName}.zip`
    const downloadTif = downloadDir  + `/${mapName}.tif`
    const downloadXml = downloadDir  + `/${mapName}.xml`
    const downloadAsc = downloadDir  + `/${mapName}.asc`

    console.clear()
    console.log(`\n\nLANDFIRE Request for '${mapName}' on ${new Date()}`)
    
    await ensureDirectoryExists(downloadDir)
    const jobId = await landfireSubmitRequest(params)
    const status = await landfirePollStatus(jobId)
    await landfireDownloadFile(status.outputFile, downloadZip)
    await landfireUnzipDownloadFile(downloadZip, downloadDir, mapName)
    await describeGeoTIFF(downloadTif)
    const xmlJson = landfireReadXmlFile(downloadXml)
    // console.log(xmlJson)
    landfireConvertGeoTiffToAscii(downloadTif, downloadDir, xmlJson)
}

const CouncilGrove = {west: -114.25, south: 46.78, east: -114.10, north: 46.93}
const MtSentinnel = {west: -113.983, south: 46.825, east: -113.950, north: 46.865}
await getLandfire('MtSentinnel', MtSentinnel)
