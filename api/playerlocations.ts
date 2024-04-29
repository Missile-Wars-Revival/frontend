import axiosInstance from "./axios-instance";

export async function fetchPlayerLocations() {
  try {
    const response = await axiosInstance.get("/api/playerlocations");
    return response.data;
  } catch (error) {
    console.error("Error fetching player locations:", error);
    throw error;
  }
}

