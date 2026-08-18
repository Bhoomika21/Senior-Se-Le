// Haversine formula — returns distance in km between two lat/lng points
export function getDistanceKm(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null

  const R = 6371
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
    // If book has no location, always show it (don't hide locationless books)
    if (!book.lat || !book.lng) return true

    const dist = getDistanceKm(
      Number(userLat), Number(userLng),
      Number(book.lat), Number(book.lng)
    )
    if (dist === null) return true
    return dist <= radiusKm
  })
}
