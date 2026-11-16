import { fromFile } from 'geotiff';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Parses a multi-band GeoTIFF and writes each band out as an ESRI ASCII raster (.asc).
 * @param {string} inputTiffPath - Path to input GeoTIFF.
 * @param {string} outputDir - Directory to save ASCII files.
 * @param {object} bandData - Array of band objects returned by landfireReadAuxFile(),
 *  let {number, name, units, type, maximum, minimum, mean, median, stddev} = band[i]
 * @param {string} baseName - Base output file name prefix.
 */
export async function landfireConvertGeoTiffToAscii(inputTiffPath, outputDir, bandData, baseName='') {
    console.log(`⏳ Coverting GeoTIFF '${inputTiffPath}' bands into ASCII files ...`);
    
    const tiff = await fromFile(inputTiffPath);
    const image = await tiff.getImage();

    const width = image.getWidth();
    const height = image.getHeight();
    const samplesPerPixel = image.getSamplesPerPixel(); // Number of bands
    const noDataValue = image.fileDirectory.GDAL_NODATA 
        ? parseFloat(image.fileDirectory.GDAL_NODATA) 
        : -9999;

    // Extract geotransform parameters (Bounding Box and ModelPixelScale)
    const bbox = image.getBoundingBox();
    const [xMin, yMin, xMax, yMax] = bbox;
    const cellsizeX = (xMax - xMin) / width;
    const cellsizeY = (yMax - yMin) / height;
    console.log(`    Image Size: ${width} x ${height}, Bands: ${samplesPerPixel}`);

    // Read raster pixel values for all bands
    const rasterData = await image.readRasters()

    for (let b = 0; b < samplesPerPixel; b++) {
        const bandArray = rasterData[b];
        // const bandIndex = b + 1;
        
        const {number, name, units, type, maximum, minimum, mean, median, stddev} = bandData[b]
        const fileName = (baseName !== '') ? `${baseName}_${name}.asc` : `${name}.asc`
        const outputPath = path.join(outputDir, fileName);

        // Build ESRI ASCII Header
        let asciiContent = `ncols         ${width}\n`;
        asciiContent += `nrows         ${height}\n`;
        asciiContent += `xllcorner     ${xMin}\n`;
        asciiContent += `yllcorner     ${yMin}\n`;
        asciiContent += `cellsize      ${cellsizeX}\n`;
        asciiContent += `NODATA_value  ${noDataValue}\n`;

        // Convert pixel array to space-separated rows
        for (let row = 0; row < height; row++) {
            const rowOffset = row * width;
            const rowValues = new Array(width);

            for (let col = 0; col < width; col++) {
                const val = bandArray[rowOffset + col];
                // Handle undefined or null pixel values
                rowValues[col] = (val === null || val === undefined || Number.isNaN(val)) 
                    ? noDataValue 
                    : val;
            }
            asciiContent += rowValues.join(' ') + '\n';
        }

        // Write .asc file
        await writeFile(outputPath, asciiContent, 'utf-8');
        console.log(`    ✅ Created ASCII file ${name} ...`);
    }

    console.log('✅ GeoTIFF to ASCII conversion completed successfully!');
}