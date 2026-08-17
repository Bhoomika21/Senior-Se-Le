// Convert Indian PIN code to lat/lng using free postal pincode API
// No API key required
export async function pinToLatLng(pin) {
  if (!pin || pin.toString().length !== 6) return null
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
    const data = await res.json()
    if (data?.[0]?.Status !== 'Success') return null
    const office = data[0].PostOffice?.[0]
    if (!office) return null
    // This API doesn't return lat/lng directly, so we use nominatim with the place name
    const place = `${office.Name}, ${office.District}, ${office.State}, India`
    return await geocodePlace(place)
  } catch {
    return null
  }
}

// Geocode a place name using OpenStreetMap Nominatim (free, no key)
async function geocodePlace(place) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    if (!data?.[0]) return null
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      display: data[0].display_name?.split(',').slice(0, 3).join(','),
    }
  } catch {
    return null
  }
}
