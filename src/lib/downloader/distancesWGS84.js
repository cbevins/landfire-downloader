// Shared WGS84 Ellipsoid Constants (natively in meters)
const WGS84 = {
    SEMI_MAJOR_AXIS: 6378137.0, // Equatorial radius in meters (a)
    FLATTENING: 1 / 298.257223563, // Flattening (f)
    get ECCENTRICITY_SQ() {
        return 2 * this.FLATTENING - Math.pow(this.FLATTENING, 2); // First eccentricity squared (e^2)
    },
};

/**
 * Calculates the exact length of 1 degree of latitude (north-south) in meters
 * at a specific *latitude* using the WGS84 ellipsoid model.
 *
 * @param {number} latitude - Latitude in decimal degrees (-90 to 90).
 * @returns {number} Exact meters per degree of latitude.
 */
export function getMetersPerDegreeLatitude(latitude) {
    const latRad = (latitude * Math.PI) / 180
    const sinLat = Math.sin(latRad)

    // Meridian radius of curvature (M) in meters
    const denominator = Math.pow(1 - WGS84.ECCENTRICITY_SQ * Math.pow(sinLat, 2), 1.5)
    const meridianRadiusMeters = (WGS84.SEMI_MAJOR_AXIS * (1 - WGS84.ECCENTRICITY_SQ)) / denominator

    return (Math.PI / 180) * meridianRadiusMeters
}

/**
 * Converts a north-south distance in meters into decimal degrees of latitude
 * using the exact WGS84 ellipsoid.
 *
 * @param {number} latitude - The center latitude in decimal degrees.
 * @param {number} heightInMeters - The north-south distance in meters.
 * @returns {number} The height in decimal degrees of latitude.
 */
export function getDegreesLatitudeFromHeightInMeters(latitude, heightInMeters) {
    const metersPerDegree = getMetersPerDegreeLatitude(latitude);
    return heightInMeters / metersPerDegree;
}

/**
 * Calculates the exact length of 1 degree of longitude (east-west) in meters
 * at a specific *latitude* using the WGS84 ellipsoid model.
 *
 * @param {number} latitude - Latitude in decimal degrees (-90 to 90).
 * @returns {number} Exact meters per degree of longitude (0 at the poles).
 */
export function getMetersPerDegreeLongitude(latitude) {
    const latRad = (latitude * Math.PI) / 180
    const sinLat = Math.sin(latRad)
    const cosLat = Math.cos(latRad)

    // Return 0 at the exact North or South Pole to avoid floating-point noise
    if (Math.abs(cosLat) < 1e-10) return 0

    // Prime vertical radius of curvature (N) in meters
    const primeVerticalRadiusMeters =
        WGS84.SEMI_MAJOR_AXIS / Math.sqrt(1 - WGS84.ECCENTRICITY_SQ * Math.pow(sinLat, 2))

    return (Math.PI / 180) * primeVerticalRadiusMeters * cosLat
}

/**
 * Converts an east-west distance in meters along a parallel of latitude into
 * decimal degrees of longitude using the exact WGS84 ellipsoid.
 *
 * @param {number} latitude - The latitude in decimal degrees (-90 to 90).
 * @param {number} widthInMeters - The east-west distance in meters.
 * @returns {number} The width in decimal degrees.
 */
export function getDegreesLongitudeFromWidthInMeters(latitude, widthInMeters) {
    const metersPerDegree = getMetersPerDegreeLongitude(latitude)
    return widthInMeters / metersPerDegree;
}

// --- Example Usage ---
const latitude = 45.6387; // Vancouver, WA
const distanceMeters = 1000; // 1 kilometer (1,000 meters)

const metersPerDegLat = getMetersPerDegreeLatitude(latitude)
const metersPerDegLon = getMetersPerDegreeLongitude(latitude)

const latHeightDeg = getDegreesLatitudeFromHeightInMeters(latitude, distanceMeters);
const latWidthDeg = getDegreesLongitudeFromWidthInMeters(latitude, distanceMeters);

console.log(`Meters per degree of latitude at ${latitude}°: ${metersPerDegLat.toFixed(4)} m`);
// Output: ~111,144.3886 m

console.log(`Meters per degree of longitude at ${latitude}°: ${metersPerDegLon.toFixed(4)} m`);

console.log(`1,000 m North-South at ${latitude}°: ${latHeightDeg.toFixed(8)}°`);
// Output: ~0.00899731°

console.log(`1,000 m East-West at ${latitude}°: ${latWidthDeg.toFixed(8)}°`);
// Output: ~0.01284483°

export function calcGeoBox(midLon, midLat, width, height) {
    const htDeg = getDegreesLatitudeFromHeightInMeters(midLat, height)
    const northLat = midLat + htDeg / 2
    const southLat = midLat - htDeg / 2

    // Get width at the north
    const wdDegMid = getDegreesLongitudeFromWidthInMeters(midLat, width)
    const wdDegNo = getDegreesLongitudeFromWidthInMeters(northLat, width)
    const wdDegSo = getDegreesLongitudeFromWidthInMeters(southLat, width)
    const eastLonMid = midLon + wdDegMid / 2
    const eastLonSo = midLon + wdDegSo / 2
    const eastLonNo = midLon + wdDegNo / 2
    const westLonMid = midLon - wdDegMid / 2
    const westLonSo = midLon - wdDegSo / 2
    const westLonNo = midLon - wdDegNo / 2
    const corners = {
        xy: [midLon, midLat],
        n: [midLon, northLat],
        ne: [eastLonNo, northLat],
        e: [eastLonMid, midLat],
        se: [eastLonSo, southLat],
        s: [midLon, southLat],
        sw: [westLonSo, southLat],
        w: [westLonMid, midLat],
        nw: [westLonNo, northLat]
    }
    return {htDeg, wdDegNo, wdDegMid, wdDegSo, northLat, southLat,
        eastLonNo, eastLonMid, eastLonSo, westLonNo, westLonMid, westLonSo}
}

// Attempt to recreate the LANDFITE bbox

// Bbox centered at lat 47 lon -114 plus/minus 0.01 degree is 51 col x 75 rows
const AOI_47_114_01 = {west: -114.01, south: 46.99, east: -113.99, north: 47.01}

// Bbox centered at lat 47 lon -114 plus/minus 0.1 degree
const AOI_47_114_1 = {west: -114.1, south: 46.9, east: -113.9, north: 47.1}

// Bbox centered at lat 47 lon -114 plus/minus 0.5 degree is 2559 cols x 3710 r
const AOI_47_114_5 = {west: -114.5, south: 46.5, east: -113.5, north: 47.5}
console.table(calcGeoBox(-114, 47, 30*2559, 30*3710))