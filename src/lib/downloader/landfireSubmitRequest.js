/**
 * Submits a LANDFIRE download request.
 * This text works fine when pasted into a browser:
 * https://lfps.usgs.gov/api/job/submit?Email=cbevins@montana.com&Output_Projection=6414&Resample_Resolution=90&Layer_List=LF2020_Elev;LF2020_SlpD;LF2020_Asp;LF2023_FBFM40;LF2023_CC;LF2023_CH;LF2023_CBH;LF2023_CBD&Include_Layer_List_XML_File=false&Area_of_Interest=-123.7835%2041.7534%20-123.6352%2041.8042&Edit_Rule={"edit":[{"condition":[{"product":"LF2020_Elev","operator":"lt","value":500}],"change":[{"product":"LF2023_FBFM40","operator":"st","value":181},{"product":"LF2023_CBH","operator":"ib","value":5}]}]}
 */

export const LANDFIRE_SUBMIT_URL = `https://lfps.usgs.gov/api/job/submit?`

export async function landfireSubmitRequest(params) {
    // Create the URL request strinbng
    const urlParams = new URLSearchParams(params)
    let url = LANDFIRE_SUBMIT_URL + urlParams.toString()

    const res = await fetch(url)
    console.log(`🚀 Submitting request to LANDFIRE...`)
    if (!res.ok) {
        console.log('❌ Request failed:', res)
        throw new Error(`export request failed: ${res.status} ${res.statusText}`);
    }
    const data = await res.json()
    if (data.error) {
        throw new Error(`ArcGIS error: ${JSON.stringify(data.error)}`)
    }
    if (!data.jobId) {
        throw new Error(`No jobId in response: ${JSON.stringify(data).slice(0, 500)}`)
    }
    console.log(`✅ FETCH submitted job successfully. Job ID: ${data.jobId}`)
    return data.jobId
}
