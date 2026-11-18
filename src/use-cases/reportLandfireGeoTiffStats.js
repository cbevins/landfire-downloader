import { loadGeoTiffRasters, calcRasterStats } from "#lib"

function makeTifPath(map) { return `c:/Landfire/downloads/${map}/${map}.tif` }

const file = 'AOI_47_114_5'
const tifPath =  makeTifPath(file)

// Load (and decode) the GeoTIFF into its raster bands
const t0 = performance.now()
const rasters = await loadGeoTiffRasters(tifPath)
const t1 = performance.now()
console.log(`Msec to loadTiffRasters(): ${Math.round(t1-t0)}`)

// Derive and display some stats for each layer
const table = []
table.push({theme: 'elev (1 = 1 m)', ...calcRasterStats(rasters[0])})
table.push({theme: 'slpD (1 = 1 deg)', ...calcRasterStats(rasters[1])})
table.push({theme: 'asp (1 = 1 deg)', ...calcRasterStats(rasters[2])})
table.push({theme: 'FBFM40 (class)', ...calcRasterStats(rasters[3])})
table.push({theme: 'canopy cover (1 = 1%)', ...calcRasterStats(rasters[4])})
table.push({theme: 'canopy height (1 = 0.1 m)', ...calcRasterStats(rasters[5])})
table.push({theme: 'canopy base (1 = 0.1 m)', ...calcRasterStats(rasters[6])})
table.push({theme: 'canopy bulk density (1 = 0.01 Kg/m3)', ...calcRasterStats(rasters[7])})
console.table(table)
const t2 = performance.now()
console.log(`Msec to calcRasterStats() on all layers: ${Math.round(t2-t1)}`)

// Display the map extent
const extent = []
const {width, height} = rasters
function toM(v) { return v * 30 }
function toKm(v) { return v * 30 / 1000 }
function toFt(v) { return Math.round(v * 30 * 3.2808) }
function toMi(v) { return Math.round(100 * v * 30 * 3.2808 / 5280) / 100 }
extent.push({dim: 'width', cells: width, meters: toM(width), km: toKm(width), feet: toFt(width), miles: toMi(width)})
extent.push({dim: 'height', cells: height, meters: toM(height), km: toKm(height), feet: toFt(height), miles: toMi(height)})
console.table(extent)

// Display the raw values for a central cell
const item = []
let idx = Math.trunc(width * height/2 + width/2)    // a central cell
item.push({theme: 'elev (1 = 1 m)', val: rasters[0][idx]})
item.push({theme: 'slpD (1 = 1 deg)', val: rasters[1][idx]})
item.push({theme: 'asp (1 = 1 deg)', val: rasters[2][idx]})
item.push({theme: 'FBFM40 (class)', val: rasters[3][idx]})
item.push({theme: 'canopy cover (1 = 1%)', val: rasters[4][idx]})
item.push({theme: 'canopy height (1 = 0.1 m)', val: rasters[5][idx]})
item.push({theme: 'canopy base (1 = 0.1 m)', val: rasters[6][idx]})
item.push({theme: 'canopy bulk density (1 = 0.01 Kg/m3)', val: rasters[7][idx]})
console.table(item)
