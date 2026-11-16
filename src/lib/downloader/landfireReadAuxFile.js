import fs from 'node:fs';
import path from 'node:path';
import { XMLParser } from 'fast-xml-parser';

/**
 * Reads an XML file and converts its contents into a JavaScript Object / JSON.
 * 
 * @param {string} filePath - Path to the XML file.
 * @returns {Object|null}
 */
export function readXmlAsJson(filePath) {
    try {
        const absolutePath = path.resolve(filePath);

        if (!fs.existsSync(absolutePath)) {
            console.error(`Error: File not found at ${absolutePath}`);
            return null;
        }

        // 1. Read the XML file text
        const xmlData = fs.readFileSync(absolutePath, 'utf-8');

        // 2. Configure the XML Parser options
        const parser = new XMLParser({
            ignoreAttributes: false,      // Preserve XML attributes (e.g. <item id="123">)
            attributeNamePrefix: '@_',    // Prefix for attribute keys in the resulting JSON
            parseTagValue: true,          // Automatically convert numbers and booleans
            trimValues: true,             // Trim whitespace around text values
        });

        // 3. Parse XML text to a JavaScript Object
        const jsonObject = parser.parse(xmlData);

        return jsonObject
    } catch (error) {
        console.error(`Failed to parse XML file: ${error.message}`);
        return null
    }
}

// Returns an array of LANDFIRE XML band data
export function landfireReadAuxFile(fullFileName) {
    const xml = readXmlAsJson(fullFileName)
    if (!xml) {
        throw new Error(`❌ Unable to read LANDFIRE XML file ${fullFileName}.`)
    }
    const bands = []
    for(let band of xml.PAMDataset.PAMRasterBand) {
        const obj = {
            number: band['@_band'],
            name: band.Description,
            units: band.UnitOfMeasure,
        }
        for(let mdi of band.Metadata.MDI) {
            // console.log(`Band ${obj.number} mdi`, mdi)
            if (mdi['@_key'] === 'STATISTICS_MAXIMUM') {
                obj.maximum = mdi['#text']
            } else if (mdi['@_key'] === 'STATISTICS_MINIMUM') {
                obj.minimum = mdi['#text']
            } else if (mdi['@_key'] === 'STATISTICS_MEAN') {
                obj.mean = mdi['#text']
            } else if (mdi['@_key'] === 'STATISTICS_MEDIAN') {
                obj.median = mdi['#text']
            } else if (mdi['@_key'] === 'STATISTICS_STDEV') {
                obj.stdev = mdi['#text']
            } else if (mdi['@_key'] === 'STATISTICS_SKIPFACTORX') {
                obj.skipFactorX = mdi['#text']
            } else if (mdi['@_key'] === 'STATISTICS_SKIPFACTORY') {
                obj.skipFactorY = mdi['#text']
            } else if (mdi['@_key'] === 'STATISTICS_COVARIANCES') {
                obj.covariances = mdi['#text'].split(',')
            } else if (mdi['@_key'] === 'BandName') {
                obj.mdiName = mdi['#text']
            } else if (mdi['@_key'] === 'RepresentationType') {
                obj.type = mdi['#text']
            }
        }
        let h = band.Histograms.HistItem
        obj.hist = {
            minimum: h.HistMin,
            maximum: h.HistMax,
            bucketCount: h.BucketCount,
            includeOutOfRange: h.IncludeOutOfRange,
            approximate: h.Approximate,
            counts: h.HistCounts.split('|'),
        }
        bands.push(obj)
    }
    return bands
}
