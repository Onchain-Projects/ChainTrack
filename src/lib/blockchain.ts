import { ethers } from 'ethers';
import { normalizeAddress } from './ethUtils';

// Updated ABI for ChainTrackSupplyChain contract with Merkle tree support
export const CHAINTRACK_ABI = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "string",
        name: "batchCode",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "productType",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "manufacturer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "merkleRoot",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "BatchCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "string",
        name: "batchCode",
        type: "string",
      },
      {
        indexed: true,
        internalType: "address",
        name: "fromUser",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "toUser",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "location",
        type: "string",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256",
      },
    ],
    name: "MovementRecorded",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_batchCode",
        type: "string",
      },
      {
        internalType: "string",
        name: "_productType",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_productionDate",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_expiryDate",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "_merkleRoot",
        type: "bytes32",
      },
    ],
    name: "createBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_batchCode",
        type: "string",
      },
      {
        internalType: "address",
        name: "_fromUser",
        type: "address",
      },
      {
        internalType: "address",
        name: "_toUser",
        type: "address",
      },
      {
        internalType: "string",
        name: "_location",
        type: "string",
      },
    ],
    name: "recordMovement",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_batchCode",
        type: "string",
      },
    ],
    name: "getBatch",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "batchCode",
            type: "string",
          },
          {
            internalType: "string",
            name: "productType",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "productionDate",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "expiryDate",
            type: "uint256",
          },
          {
            internalType: "address",
            name: "manufacturer",
            type: "address",
          },
          {
            internalType: "bytes32",
            name: "merkleRoot",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "createdAt",
            type: "uint256",
          },
          {
            internalType: "bool",
            name: "exists",
            type: "bool",
          },
        ],
        internalType: "struct ChainTrackSupplyChain.Batch",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_batchCode",
        type: "string",
      },
    ],
    name: "getMovements",
    outputs: [
      {
        components: [
          {
            internalType: "string",
            name: "batchCode",
            type: "string",
          },
          {
            internalType: "address",
            name: "fromUser",
            type: "address",
          },
          {
            internalType: "address",
            name: "toUser",
            type: "address",
          },
          {
            internalType: "string",
            name: "location",
            type: "string",
          },
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256",
          },
        ],
        internalType: "struct ChainTrackSupplyChain.Movement[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_batchCode",
        type: "string",
      },
    ],
    name: "getBatchMerkleRoot",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_batchCode",
        type: "string",
      },
      {
        internalType: "bytes32",
        name: "_leaf",
        type: "bytes32",
      },
      {
        internalType: "bytes32[]",
        name: "_proof",
        type: "bytes32[]",
      },
    ],
    name: "verifyMerkleProof",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
    ],
    name: "isManufacturer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
    ],
    name: "isDistributor",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_address",
        type: "address",
      },
    ],
    name: "isRetailer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_manufacturer",
        type: "address",
      },
    ],
    name: "registerManufacturer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_distributor",
        type: "address",
      },
    ],
    name: "registerDistributor",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_retailer",
        type: "address",
      },
    ],
    name: "registerRetailer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Polygon Amoy Testnet Configuration
export const CHAINTRACK_CONTRACT_ADDRESS = "0x444607c3F4788e8cB1f8B29132c6Ea6F4cac01bc";
export const POLYGON_AMOY_CHAIN_ID = 80002;
export const AMOY_EXPLORER_URL = "https://amoy.polygonscan.com";
// Use custom Alchemy RPC URL from env, fallback to public RPC
export const AMOY_RPC_URL = import.meta.env.VITE_POLYGON_AMOY_RPC_URL || "https://rpc-amoy.polygon.technology/";

/**
 * Get a read-only provider for blockchain queries (no wallet needed)
 * Uses your custom Alchemy RPC URL from environment variables
 */
export function getReadOnlyProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(AMOY_RPC_URL);
}

export interface BatchData {
  batchCode: string;
  productType: string;
  productionDate: Date;
  expiryDate: Date;
  manufacturer: string;
  merkleRoot: string;
  exists: boolean;
}

export interface MovementData {
  batchCode: string;
  fromUser: string;
  toUser: string;
  location: string;
  timestamp: number;
}

export class ChainTrackContract {
  private contract: ethers.Contract;
  private signer: ethers.JsonRpcSigner | null;
  private provider: ethers.Provider;

  constructor(signerOrProvider: ethers.JsonRpcSigner | ethers.Provider) {
    // Check if it's a signer (for write operations) or provider (for read-only)
    if ('getAddress' in signerOrProvider) {
      // It's a signer
      this.signer = signerOrProvider as ethers.JsonRpcSigner;
      this.provider = this.signer.provider!;
    } else {
      // It's a provider (read-only)
      this.signer = null;
      this.provider = signerOrProvider as ethers.Provider;
    }
    
    this.contract = new ethers.Contract(
      CHAINTRACK_CONTRACT_ADDRESS,
      CHAINTRACK_ABI,
      this.provider
    );
  }

  async createBatch(
    batchCode: string,
    productType: string,
    productionDate: Date,
    expiryDate: Date,
    merkleRoot: string = ethers.ZeroHash
  ): Promise<{ hash: string; success: boolean; error?: string }> {
    if (!this.signer) {
      return {
        hash: '',
        success: false,
        error: 'Signer required for write operations'
      };
    }
    
    try {
      // Use signer for write operations
      const contractWithSigner = new ethers.Contract(
        CHAINTRACK_CONTRACT_ADDRESS,
        CHAINTRACK_ABI,
        this.signer
      );
      
      const tx = await contractWithSigner.createBatch(
        batchCode,
        productType,
        Math.floor(productionDate.getTime() / 1000),
        Math.floor(expiryDate.getTime() / 1000),
        merkleRoot
      );

      await tx.wait();
      return { hash: tx.hash, success: true };
    } catch (error) {
      console.error('Error creating batch:', error);
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async recordMovement(
    batchCode: string,
    fromUser: string,
    toUser: string,
    location: string = ""
  ): Promise<{ hash: string; success: boolean; error?: string }> {
    if (!this.signer) {
      return {
        hash: '',
        success: false,
        error: 'Signer required for write operations'
      };
    }
    
    try {
      // Normalize addresses before blockchain call
      const normalizedFromUser = normalizeAddress(fromUser);
      const normalizedToUser = normalizeAddress(toUser);
      
      // Use signer for write operations
      const contractWithSigner = new ethers.Contract(
        CHAINTRACK_CONTRACT_ADDRESS,
        CHAINTRACK_ABI,
        this.signer
      );
      
      const tx = await contractWithSigner.recordMovement(
        batchCode,
        normalizedFromUser,
        normalizedToUser,
        location
      );
      await tx.wait();
      return { hash: tx.hash, success: true };
    } catch (error) {
      console.error('Error recording movement:', error);
      
      // Check for address-related errors
      if (error instanceof Error && error.message.includes("Invalid address")) {
        return {
          hash: '',
          success: false,
          error: 'Invalid wallet address format. Please check and retry.'
        };
      }
      
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getBatch(batchCode: string): Promise<BatchData | null> {
    try {
      const batch = await this.contract.getBatch(batchCode);
      
      return {
        batchCode: batch.batchCode,
        productType: batch.productType,
        productionDate: new Date(Number(batch.productionDate) * 1000),
        expiryDate: new Date(Number(batch.expiryDate) * 1000),
        manufacturer: batch.manufacturer,
        merkleRoot: batch.merkleRoot,
        exists: batch.exists,
      };
    } catch (error) {
      console.error('Error getting batch:', error);
      return null;
    }
  }

  async getMovements(batchCode: string): Promise<MovementData[]> {
    try {
      const movements = await this.contract.getMovements(batchCode);
      return movements.map((movement: any) => ({
        batchCode: movement.batchCode,
        fromUser: movement.fromUser,
        toUser: movement.toUser,
        location: movement.location || '',
        timestamp: Number(movement.timestamp)
      }));
    } catch (error) {
      console.error('Error getting movements:', error);
      return [];
    }
  }

  async isManufacturer(address: string): Promise<boolean> {
    try {
      const normalizedAddress = normalizeAddress(address);
      return await this.contract.isManufacturer(normalizedAddress);
    } catch (error) {
      console.error('Error checking manufacturer status:', error);
      return false;
    }
  }

  async isDistributor(address: string): Promise<boolean> {
    try {
      const normalizedAddress = normalizeAddress(address);
      return await this.contract.isDistributor(normalizedAddress);
    } catch (error) {
      console.error('Error checking distributor status:', error);
      return false;
    }
  }

  async isRetailer(address: string): Promise<boolean> {
    try {
      const normalizedAddress = normalizeAddress(address);
      return await this.contract.isRetailer(normalizedAddress);
    } catch (error) {
      console.error('Error checking retailer status:', error);
      return false;
    }
  }

  async verifyMerkleProof(
    batchCode: string,
    leaf: string,
    proof: string[]
  ): Promise<boolean> {
    try {
      return await this.contract.verifyMerkleProof(batchCode, leaf, proof);
    } catch (error) {
      console.error('Error verifying Merkle proof:', error);
      return false;
    }
  }

  async getBatchMerkleRoot(batchCode: string): Promise<string | null> {
    try {
      const root = await this.contract.getBatchMerkleRoot(batchCode);
      return root;
    } catch (error) {
      console.error('Error getting Merkle root:', error);
      return null;
    }
  }

  async registerManufacturer(manufacturerAddress: string): Promise<{ hash: string; success: boolean; error?: string }> {
    if (!this.signer) {
      return {
        hash: '',
        success: false,
        error: 'Signer required for write operations'
      };
    }
    
    try {
      const normalizedAddress = normalizeAddress(manufacturerAddress);
      // Use signer for write operations
      const contractWithSigner = new ethers.Contract(
        CHAINTRACK_CONTRACT_ADDRESS,
        CHAINTRACK_ABI,
        this.signer
      );
      
      const tx = await contractWithSigner.registerManufacturer(normalizedAddress);
      await tx.wait();
      return { hash: tx.hash, success: true };
    } catch (error) {
      console.error('Error registering manufacturer:', error);
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async registerDistributor(distributorAddress: string): Promise<{ hash: string; success: boolean; error?: string }> {
    if (!this.signer) {
      return {
        hash: '',
        success: false,
        error: 'Signer required for write operations'
      };
    }
    
    try {
      const normalizedAddress = normalizeAddress(distributorAddress);
      // Use signer for write operations
      const contractWithSigner = new ethers.Contract(
        CHAINTRACK_CONTRACT_ADDRESS,
        CHAINTRACK_ABI,
        this.signer
      );
      
      const tx = await contractWithSigner.registerDistributor(normalizedAddress);
      await tx.wait();
      return { hash: tx.hash, success: true };
    } catch (error) {
      console.error('Error registering distributor:', error);
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async registerRetailer(retailerAddress: string): Promise<{ hash: string; success: boolean; error?: string }> {
    if (!this.signer) {
      return {
        hash: '',
        success: false,
        error: 'Signer required for write operations'
      };
    }
    
    try {
      const normalizedAddress = normalizeAddress(retailerAddress);
      // Use signer for write operations
      const contractWithSigner = new ethers.Contract(
        CHAINTRACK_CONTRACT_ADDRESS,
        CHAINTRACK_ABI,
        this.signer
      );
      
      const tx = await contractWithSigner.registerRetailer(normalizedAddress);
      await tx.wait();
      return { hash: tx.hash, success: true };
    } catch (error) {
      console.error('Error registering retailer:', error);
      return {
        hash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const getPolygonscanUrl = (hash: string, type: 'tx' | 'address' = 'tx'): string => {
  return `${AMOY_EXPLORER_URL}/${type}/${hash}`;
};

export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const validateAmoyNetwork = async (): Promise<boolean> => {
  if (typeof window.ethereum === 'undefined') return false;
  
  try {
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    return parseInt(chainId, 16) === POLYGON_AMOY_CHAIN_ID;
  } catch (error) {
    console.error('Failed to validate network:', error);
    return false;
  }
};

export const getAmoyNetworkConfig = () => ({
  chainId: '0x13882',
  chainName: 'Polygon Amoy Testnet',
  nativeCurrency: {
    name: 'MATIC',
    symbol: 'MATIC',
    decimals: 18,
  },
  rpcUrls: [AMOY_RPC_URL],
  blockExplorerUrls: [AMOY_EXPLORER_URL],
});
