import { describeGeoTiff } from '#lib/index.js'
function tifPath(map) { return `c:/Landfire/downloads/${map}/${map}.tif` }

await describeGeoTiff(tifPath('AOI_47_114_01'))
// await describeGeoTiff(tifPath('MAP_19'))
