import fs from 'node:fs';
import path from 'node:path';
import { fromFile } from 'geotiff';

/**
 * Basic helper to parse key metadata tags from LANDFIRE/GIS XML metadata files.
 * Supports standard USGS/FGDC and ArcGIS XML schema tags.
 */
function parseXmlMetadata(xmlString) {
    const metadata = {
        title: null,
        abstract: null,
        bands: [] // Extracted band descriptions or attribute details
    };

    // Extract title/abstract if available
    const titleMatch = xmlString.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) metadata.title = titleMatch[1].trim();

    const abstractMatch = xmlString.match(/<abstract>(.*?)<\/abstract>/i);
    if (abstractMatch) metadata.abstract = abstractMatch[1].trim();

    // Parse Attribute / Band definitions (common in FGDC metadata under <attr>)
    const attrRegex = /<attr>([\s\S]*?)<\/attr>/gi;
    let attrMatch;

    while ((attrMatch = attrRegex.exec(xmlString)) !== null) {
        const attrBlock = attrMatch[1];
        const label = attrBlock.match(/<attrlabl>(.*?)<\/attrlabl>/i)?.[1]?.trim();
        const def = attrBlock.match(/<attrdef>(.*?)<\/attrdef>/i)?.[1]?.trim();

        if (label) {
            metadata.bands.push({
                name: label,
                description: def || null
            });
        }
    }
    console.log('METADATA', metadata)
    return metadata;
}

/**
 * Attempts to locate and read an XML sidecar file matching the target TIFF file path.
 */
function loadSidecarXml(filePath) {
    // Check common XML sidecar naming conventions:
    const candidatePaths = [
        filePath.replace(/\.tif?$/i, '.xml'),
        `${filePath}.xml`,
        filePath.replace(/\.tiff?$/i, '.xml'),
    ];

    for (const xmlPath of candidatePaths) {
        const absoluteXmlPath = path.resolve(xmlPath);
        if (fs.existsSync(absoluteXmlPath)) {
            try {
                const xmlContent = fs.readFileSync(absoluteXmlPath, 'utf-8');
                console.log(` ✅ Found sidecar XML file '${xmlPath}`)

                return {
                    path: absoluteXmlPath,
                    data: parseXmlMetadata(xmlContent)
                }
            } catch (err) {
                console.warn(`❌ Warning: Could not read XML file at ${absoluteXmlPath}:`, err.message);
            }
        }
    }
    console.log('❌ No sidecar XML file found')
    return null
}

/**
 * Maps PhotometricInterpretation GeoTIFF tags to human-readable labels.
 */
function getPhotometricLabel(code) {
    const types = {
        0: 'MinIsWhite (Grayscale)',
        1: 'MinIsBlack (Grayscale)',
        2: 'RGB',
        3: 'Palette / Color Map',
        4: 'Transparency Mask',
        5: 'CMYK',
        6: 'YCbCr',
        8: 'CIELab',
    };
    return types[code] ?? `Unknown/Custom (${code})`
}

/**
 * Merges GeoTIFF raster defaults with XML sidecar band metadata.
 */
function getBandDescription(bandIndex, totalBands, photometric, xmlBands) {
    // If the XML metadata defines a specific attribute/band for this index, use it
    if (xmlBands && xmlBands[bandIndex]) {
        const xmlInfo = xmlBands[bandIndex];
        return xmlInfo.description 
        ? `${xmlInfo.name} (${xmlInfo.description})` 
        : xmlInfo.name;
    }

    // Fallback defaults for standard imagery
    if (photometric === 2 || photometric === 'RGB') {
        const colorNames = ['Red', 'Green', 'Blue', 'Alpha / Translucency'];
        if (bandIndex < colorNames.length) return colorNames[bandIndex];
    }

    if (totalBands === 1) {
        return 'Single Channel (Grayscale / Elevation / Classified Data)';
    }

    return `Band / Channel ${bandIndex + 1}`;
}

/**
 * Parses a GeoTIFF file and its corresponding XML metadata sidecar.
 * 
 * @param {string} filePath - Path to the GeoTIFF file.
 */
export async function describeGeoTiff(filePath) {
    try {
        const absolutePath = path.resolve(filePath);
        if (!fs.existsSync(absolutePath)) {
            console.error(`Error: File not found at ${absolutePath}`);
            return;
        }

        // Check for sidecar XML metadata
        const xmlSidecar = loadSidecarXml(filePath);

        const tiff = await fromFile(absolutePath);
        const imageCount = await tiff.getImageCount();

        console.log(`========================================`);
        console.log(` GeoTIFF Summary: ${path.basename(filePath)}`);
        console.log(`========================================`);
        console.log(`Total Images/Sub-files: ${imageCount}`);

        if (xmlSidecar) {
            console.log(`Sidecar Metadata:       Found (${path.basename(xmlSidecar.path)})`);
            if (xmlSidecar.data.title) {
                console.log(`Dataset Title:          ${xmlSidecar.data.title}`);
            }
        } else {
            console.log(`Sidecar Metadata:       None found`);
        }
        console.log('');

        for (let i = 0; i < imageCount; i++) {
            const image = await tiff.getImage(i);

            const width = image.getWidth();
            const height = image.getHeight();
            const samplesPerPixel = image.getSamplesPerPixel();
            const tileWidth = image.getTileWidth();
            const tileHeight = image.getTileHeight();

            const bbox = image.getBoundingBox();
            const resolution = image.getResolution();
            const origin = image.getOrigin();
            const geoKeys = image.getGeoKeys();
            const fileDirectory = image.getFileDirectory();

            const photometricCode = fileDirectory.PhotometricInterpretation;
            const photometricLabel = getPhotometricLabel(photometricCode);

            console.log(`--- Image Directory #${i + 1} ---`);
            console.log(`Image Width:          ${width.toLocaleString()}`)
            console.log(`Image Height:         ${height.toLocaleString()}`)
            console.log(`Image Pixels:         ${(width*height).toLocaleString()}`)
            console.log(`Total Bands/Channels: ${samplesPerPixel}`);
            console.log(`Color Space:          ${photometricLabel}`);
            console.log(`Tile Dimensions:      ${tileWidth} x ${tileHeight}`);

            if (origin && origin.length >= 2) {
                console.log(`Origin (X, Y):      ${origin[0]}, ${origin[1]}`);
            }

            if (resolution && resolution.length >= 2) {
                console.log(`Pixel Resolution:   X: ${Math.abs(resolution[0])}, Y: ${Math.abs(resolution[1])}`);
            }

            if (bbox) {
                console.log(`Bounding Box:       Min (${bbox[0]}, ${bbox[1]}) -> Max (${bbox[2]}, ${bbox[3]})`);
            }

            if (geoKeys) {
                console.log(`GeoKeys Metadata:`);
                if (geoKeys.GeographicTypeGeoKey) console.log(`  Geographic CRS Code: ${geoKeys.GeographicTypeGeoKey}`);
                if (geoKeys.ProjectedCSTypeGeoKey) console.log(`  Projected CRS Code:  ${geoKeys.ProjectedCSTypeGeoKey}`);
            }

            // Read a 100x100 sample block to inspect channel data types and values
            const rasters = await image.readRasters({ 
                window: [0, 0, Math.min(width, 100), Math.min(height, 100)] 
            });

            console.log(`\nChannel Details (${samplesPerPixel} Total):`);
            console.log(`----------------------------------------`);

            const xmlBands = xmlSidecar?.data?.bands;

            for (let bandIdx = 0; bandIdx < samplesPerPixel; bandIdx++) {
                const bandData = rasters[bandIdx];
                const dataType = bandData.constructor.name;
                const description = getBandDescription(bandIdx, samplesPerPixel, photometricCode, xmlBands);

                let sampleMin = Infinity;
                let sampleMax = -Infinity;
                for (let k = 0; k < bandData.length; k++) {
                    const val = bandData[k];
                    if (val < sampleMin) sampleMin = val;
                    if (val > sampleMax) sampleMax = val;
                }

                console.log(` Channel #${bandIdx + 1}:`);
                console.log(`   Label / Role:    ${description}`);
                console.log(`   Data Format:     ${dataType}`);
                console.log(`   Sample Value[0]: ${bandData[0]}`);
                console.log(`   Sample Range:    [${sampleMin} ... ${sampleMax}]`);
            }

            console.log('\n');
        }
    } catch (error) {
        console.error("Failed to read GeoTIFF file:", error);
    }
}