// Convert Indian PIN code to lat/lng
// Uses postalpincode.in API first, then Nominatim for geocoding

export async function pinToLatLng(pin) {
  if (!pin || pin.toString().length !== 6) return null

  try {
    // Step 1: Validate PIN and get area details
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
    const data = await res.json()

    if (!data?.[0] || data[0].Status !== 'Success' || !data[0].PostOffice?.length) {
      return null // Invalid PIN
    }

    const office = data[0].PostOffice[0]
    const district = office.District
    const state = office.State
    const area = office.Name

    // Step 2: Geocode using Nominatim with district + state for better accuracy
    const query = `${district}, ${state}, India`
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=in`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'SeniorSeLe/1.0 (seniorsele.com)'
        }
      }
    )
    const geoData = await geoRes.json()

    if (!geoData?.[0]) return null

    return {
      lat: parseFloat(geoData[0].lat),
      lng: parseFloat(geoData[0].lon),
      display: `${area}, ${district}, ${state}`,
      district,
      state,
    }
  } catch (err) {
    console.error('PIN lookup error:', err)
    return null
  }
}

// Validate PIN without geocoding — just checks if it exists
export async function validatePin(pin) {
  if (!pin || pin.toString().length !== 6) return false
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
    const data = await res.json()
    return data?.[0]?.Status === 'Success'
  } catch {
    return false
  }
}
