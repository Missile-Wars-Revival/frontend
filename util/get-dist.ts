import { Location } from "../types/types";

// This is for collision calulation

export const getDistance = (
    lat1: Location["latitude"],
    lon1: Location["longitude"],
    lat2: Location["latitude"],
    lon2: Location["longitude"]
  ) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d * 1000; // Distance in meters
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };