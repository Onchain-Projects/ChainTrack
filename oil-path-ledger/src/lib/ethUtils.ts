import { getAddress, isAddress } from "ethers";

/**
 * Normalizes an Ethereum address to its checksummed format
 * @param address - The Ethereum address to normalize
 * @returns Checksummed Ethereum address
 * @throws Error if address is missing or invalid
 */
export function normalizeAddress(address: string): string {
  if (!address) {
    throw new Error("Address missing");
  }
  
  if (!isAddress(address)) {
    throw new Error(`Invalid address: ${address}`);
  }
  
  return getAddress(address); // Returns checksum-correct version
}

/**
 * Safely normalizes an address, returning null if invalid
 * @param address - The Ethereum address to normalize
 * @returns Checksummed address or null if invalid
 */
export function safeNormalizeAddress(address: string): string | null {
  try {
    return normalizeAddress(address);
  } catch {
    return null;
  }
}
