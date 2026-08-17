// Haversine formula — returns distance in km between two lat/lng points
export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg) { return deg * (Math.PI / 180) }

// Filter books by distance from user's location
export function filterByDistance(books, userLat, userLng, radiusKm) {
  if (!userLat || !userLng || !radiusKm) return books
  return books.filter((book) => {
    if (!book.lat || !book.lng) return true // no location on book — show anyway
    const dist = getDistanceKm(userLat, userLng, book.lat, book.lng)
    return dist <= radiusKm
  })
}
