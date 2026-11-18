// import fs from 'node:fs';
import { loadGeoTiffRasters } from "#lib"

// Optional: Mapping of FBFM40 codes to their standard names/descriptions for better readability
const FBFM40_NAMES = {
    0: 'Non-burnable (Water/Urban/Barren)',
    91: 'NB1: Urban/Developed',
    92: 'NB2: Snow/Ice',
    93: 'NB3: Agricultural',
    98: 'NB8: Open Water',
    99: 'NB9: Bare Ground',
    101: 'GR1: Short, Sparse Dry Climate Grass',
    102: 'GR2: Low load coarse Grass',
    103: 'GR3: Low load medium Grass',
    104: 'GR4: Moderate load coarse Grass',
    105: 'GR5: Low load dense Grass',
    106: 'GR6: Moderate load dense Grass',
    107: 'GR7: High load dense Grass',
    108: 'GR8: High load very dense Grass',
    109: 'GR9: Very High load dense Grass',
    121: 'GS1: Small, Sparse Dry Climate Shrub',
    122: 'GS2: Moderate load Shrub',
    123: 'GS3: High load Shrub',
    124: 'GS4: Very High load Shrub',
    141: 'SH1: Low Fuel Load Shrub',
    142: 'SH2: Moderate Fuel Load Shrub',
    143: 'SH3: High Fuel Load Shrub',
    144: 'SH4: Low Fuel Load Timber-Shrub',
    145: 'SH5: High Fuel Load Timber-Shrub',
    146: 'SH6: Low Fuel Load Broadleaf',
    147: 'SH7: Very High Fuel Load Shrub',
    148: 'SH8: High Fuel Load Timber-Shrub',
    149: 'SH9: Very High Fuel Load Timber-Shrub',
    161: 'TU1: Low Fuel Load Timber-Understory',
    162: 'TU2: Moderate Fuel Load Timber-Understory',
    163: 'TU3: Moderate Fuel Load Broadleaf',
    164: 'TU4: Dwarf Conifer Understory',
    165: 'TU5: High Fuel Load Timber-Understory',
    181: 'TL1: Low Fuel Load Compact Conifer Litter',
    182: 'TL2: Low Fuel Load Broadleaf Litter',
    183: 'TL3: Moderate Fuel Load Conifer Litter',
    184: 'TL4: Small blown Down Conifer',
    185: 'TL5: High Fuel Load Conifer Litter',
    186: 'TL6: Moderate Fuel Load Broadleaf Litter',
    187: 'TL7: Large blown Down Conifer',
    188: 'TL8: Long-needle Conifer Litter',
    189: 'TL9: Very High Fuel Load Broadleaf Litter'
}

function makeTifPath(map) { return `c:/Landfire/downloads/${map}/${map}.tif` }

const file = 'AOI_47_114_5'
const tifPath =  makeTifPath(file)

// Load (and decode) the GeoTIFF into its raster bands
const t0 = performance.now()
const rasters = await loadGeoTiffRasters(tifPath)
const t1 = performance.now()
console.log(`Msec to loadTiffRasters(): ${Math.round(t1-t0)}`)

// LANDFIRE fire behavior tiffs usually have FBFM40 at Band 3
const data = rasters[3]
// LANDFIRE often uses -9999 as NODATA or to specify backgrounds)
const noData = -9999

// Object to hold various FBFM40 keys
const freq = {}
    
// Loop through every pixel and count occurrences
let validCount = 0
for (let value of data) {
    // Skip typical NoData values if applicable 
    if (value === noData) continue
    validCount++
    freq[value] = (freq[value] || 0) + 1
}

// Sort by frequency (rather than by fuel model code)
const sortedCounts = Object.entries(freq).sort((a, b) => Number(b[1]) - Number(a[1]))

// Display results (sort in descending order of frequency)
const cells = rasters.width * rasters.height
const pct = (100 * validCount / cells).toFixed(2)
console.log(`\nFBFM40 Fuel Model Frequency Counts`);
console.log(`${rasters.width} Cols x ${rasters.height} Rows = ${cells.toLocaleString()} Total Cells`)
console.log(`${validCount.toLocaleString()} Valid of ${cells.toLocaleString()} Cells (${pct} %)`)
console.table(
    sortedCounts.map(([code, count]) => ({
        'Code': code,
        'Name': FBFM40_NAMES[code] || 'Unknown/Custom Code',
        'Count': count.toLocaleString().padStart(12),
        'Pct': Math.round(100 *count/validCount).toLocaleString().padStart(4),
    }))
)

const stop = performance.now()

// Display map extent
const widthMi = 30 * rasters.width * 3.2808 / 5280
const heightMi = 30 * rasters.height * 3.2808 / 5280
console.log(`Map width is ${widthMi.toFixed(4)} miles east-west`)
console.log(`Map height is ${heightMi.toFixed(4)} miles north-south`)
console.log(`Map area is ${(widthMi*heightMi).toFixed(4)} sq miles`)
console.log('Total elapsed time', Math.round(stop-t0), 'msec')