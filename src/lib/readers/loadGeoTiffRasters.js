import { fromFile, Pool } from 'geotiff';

export async function loadGeoTiffRasters(tiffPath) {
    // console.log(`Opening TIFF file: ${tiffPath}...`)
    let rasterData = null
    let pool = null
    try {
        // 1- Load the GeoTIFF file
        const tiff = await fromFile(tiffPath)

        //2 - Get the image
        const image = await tiff.getImage()
        console.log(`Decoding GeoTIFF raster with ${image.getWidth()} cols by ${image.getHeight()} rows ...`)
        
        // 3 - Read the rasters (Using Pool cuts readRasters() to about 1/3 of non-pool time)
        pool = new Pool()
        rasterData = await image.readRasters({pool})
    } catch (error) {
        console.error('loadGeoTiffRasters() - An error occurred processing the GeoTIFF:', error)
    } finally {
        pool.destroy() // Terminates the worker threads so Node can exit
    }
    // console.log(`Loaded TIFF file: ${tiffPath}...`)
    return rasterData
}
