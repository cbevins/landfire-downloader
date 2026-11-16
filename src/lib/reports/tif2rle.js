import fs from 'node:fs';
import { fromFile } from 'geotiff';

// LANDFIRE fire behavior tiffs usually have FBFM40 at Band 3
async function tif2rle(tiffPath, band=3) {
    console.log(`Reading TIFF file ${tiffPath} band ${band} ...`)
    
    try {
        // Load the GeoTIFF file
        const tiff = await fromFile(tiffPath)
        const image = await tiff.getImage()
        const width = image.getWidth()
        const height = image.getHeight()
        const pixels = width * height
        console.log(`Image width= ${width}, height=${height}, pixels=${pixels}...`)
        const rasterData = await image.readRasters()
        const fuelValues = rasterData[band]
        
        console.log('Calculating frequencies...')
        const frequencies = {}
        
        // Loop through every pixel and count occurrences
        let validCount = 0
        let i = 0
        let pairs = 0
        for(let row=0; row<height; row++) {
            let code = Math.max(0, fuelValues[i++])   // convert missing value code -9999 into 0
            let leng = 1
            pairs++
            for(let col=1; col<width; col++) {
                const value = Math.max(0, fuelValues[i++])
                if (value === code) {
                    leng++
                } else {
                    if(leng > 255) console.log(row, code, leng)
                    code = value
                    leng = 1
                    pairs++
                }
            }
        }
        const tifBytes = pixels * 16
        const rleBytes = pairs * 16
        console.log(`Number of UINT16 pixels: ${pixels.toLocaleString()}  (${tifBytes.toLocaleString()} bytes)`)
        console.log(`Number of RLE UINT8 pairs: ${pairs.toLocaleString()} (${rleBytes.toLocaleString()}) bytes`)
        console.log('Percent Tif/Rle:', Math.trunc(100*rleBytes/tifBytes))
    } catch (error) {
        console.error('An error occurred processing the GeoTIFF:', error);
    }
}
function tifPath(map) { return `c:/Landfire/downloads/${map}/${map}.tif` }

// Replace with the path to your actual LANDFIRE FBFM40 GeoTIFF file
const file = 'AOI_47_114_5'

const start = new Date()
await tif2rle(tifPath(file))
const stop = new Date()
console.log('Elapsed time:', stop-start, 'msec')