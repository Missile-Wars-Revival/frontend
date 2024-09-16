import * as Crypto from 'expo-crypto';

export const generateUID = async (token: string): Promise<string> => {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    token
  );
  return hash.slice(0, 16);
};