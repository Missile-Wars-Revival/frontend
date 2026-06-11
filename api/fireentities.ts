import axiosInstance from "./axios-instance";
import * as SecureStore from "expo-secure-store";

// All entity endpoints share the same shape: attach the stored auth token to
// the body and post. `label` names the action in logs and thrown errors.
const postWithToken = async (
  endpoint: string,
  label: string,
  body: Record<string, unknown>
) => {
  const token = await SecureStore.getItemAsync("token");
  try {
    if (!token) {
      console.log("Token not found");
      return;
    }

    const response = await axiosInstance.post(endpoint, { token, ...body });
    return response.data;
  } catch (error) {
    console.error(`Failed to ${label}:`, error);
    throw new Error(`Failed to ${label}.`);
  }
};

export const firemissileloc = (destlat: string, destlong: string, type: string) =>
  postWithToken("/api/firemissile@loc", "fire missile at location", {
    destLat: destlat.toString(),
    destLong: destlong.toString(),
    type,
  });

export const firemissileplayer = (playerusername: string, type: string) =>
  postWithToken("/api/firemissile@player", "fire missile at player", {
    playerusername,
    type,
  });

export const placelandmine = (loclat: string, loclong: string, landminetype: string) =>
  postWithToken("/api/placelandmine", "place landmine", {
    locLat: loclat.toString(),
    locLong: loclong.toString(),
    landminetype,
  });

export const steppedonlandmine = (landmineid: number, landminedamage: number) =>
  postWithToken("/api/steppedonlandmine", "process landmine hit", {
    landmineid,
    landminedamage,
  });

export const placeLoot = (loclat: string, loclong: string) =>
  postWithToken("/api/placeloot", "place loot", {
    locLat: loclat.toString(),
    locLong: loclong.toString(),
  });

export const lootpickup = (lootid: number, amount: number) =>
  postWithToken("/api/lootpickup", "pick up loot", {
    lootid,
    amount,
  });

export const initreward = (itemType: string, type: string, sentby: string) =>
  postWithToken("/api/deathreward", "process death reward", {
    itemType,
    type,
    sentby,
  });

export const placeOther = (loclat: string, loclong: string, type: string) =>
  postWithToken("/api/placeshield", "place shield", {
    type,
    loclat,
    loclong,
  });
