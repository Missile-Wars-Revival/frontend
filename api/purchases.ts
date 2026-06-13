import axios, { isAxiosError } from "axios";
import axiosInstance from "./axios-instance";
import { auth } from "../util/firebase/firebaseAuth";
import { getSecureItemSafely } from "../util/secure-store";
import { getSelectedServer } from "./server-discovery";

// Phase 9 (backend/DISTRIBUTED_HOSTING_PLAN.md): after a RevenueCat purchase
// the client NEVER decides what it earned. It asks the coordinator to verify
// the real store transaction (coordinator holds the RevenueCat secret key) and
// mint a signed grant voucher, then presents that voucher to the chosen shard,
// which verifies it and credits the player. The client only relays — it cannot
// forge coins or items.

const COORDINATOR_URL = (process.env.EXPO_PUBLIC_COORDINATOR_URL || "").replace(/\/$/, "");

export type RedeemResult =
  | { status: "success"; message: string; alreadyRedeemed: boolean }
  | { status: "not_configured" }
  | { status: "no_server" }
  | { status: "not_signed_in" }
  | { status: "no_purchase" }
  | { status: "already_redeemed" }
  | { status: "error"; error: string };

// `productId` is the RevenueCat product identifier the user just purchased
// (pkg.product.identifier — the same key the coordinator catalog is keyed on).
export async function redeemPurchase(productId: string): Promise<RedeemResult> {
  if (!COORDINATOR_URL) return { status: "not_configured" };

  const server = getSelectedServer();
  if (!server) return { status: "no_server" };

  const user = auth.currentUser;
  const token = await getSecureItemSafely("token");
  if (!user || !token) return { status: "not_signed_in" };

  // 1. Coordinator verifies the purchase and mints a voucher (aud = this shard).
  let voucher: string;
  try {
    const idToken = await user.getIdToken();
    const { data } = await axios.post(
      `${COORDINATOR_URL}/purchases/redeem`,
      { serverId: server.id, productId },
      { headers: { Authorization: `Bearer ${idToken}` }, timeout: 20000 }
    );
    voucher = data?.data?.voucher;
    if (!voucher) return { status: "error", error: "Coordinator returned no voucher" };
  } catch (error) {
    if (isAxiosError(error)) {
      const code = error.response?.data?.error?.code as string | undefined;
      if (code === "NO_PURCHASE") return { status: "no_purchase" };
      if (code === "ALREADY_REDEEMED") return { status: "already_redeemed" };
      if (code === "PURCHASES_DISABLED") return { status: "not_configured" };
      return { status: "error", error: code ?? error.message };
    }
    return { status: "error", error: String(error) };
  }

  // 2. Shard credits the player against the voucher (idempotent on retry — the
  //    coordinator re-mints the same txId to the same shard, and the shard
  //    dedupes, so a failed first attempt is safe to repeat).
  try {
    const { data } = await axiosInstance.post("/api/redeemPurchase", { token, voucher });
    return {
      status: "success",
      message: data?.message ?? "Purchase redeemed",
      alreadyRedeemed: Boolean(data?.alreadyRedeemed),
    };
  } catch (error) {
    if (isAxiosError(error)) {
      return { status: "error", error: error.response?.data?.message ?? error.message };
    }
    return { status: "error", error: String(error) };
  }
}
