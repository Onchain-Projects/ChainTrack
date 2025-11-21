import { ethers } from 'ethers';

/**
 * Merkle Tree implementation for supply chain verification
 * Provides efficient cryptographic proof of product authenticity
 */

export interface MerkleProof {
  leaf: string;
  proof: string[];
  root: string;
}

export class MerkleTree {
  private leaves: string[];
  private layers: string[][];

  constructor(data: string[]) {
    // Hash all input data to create leaves
    this.leaves = data.map(item => this.hash(item));
    this.layers = this.buildTree(this.leaves);
  }

  /**
   * Hash function using Keccak256 (same as Solidity)
   */
  private hash(data: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  /**
   * Static hash function for external use
   */
  static hash(data: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  /**
   * Combine and hash two nodes
   */
  private hashPair(left: string, right: string): string {
    // Sort to ensure deterministic hashing regardless of order
    const sorted = [left, right].sort();
    const combined = ethers.concat([sorted[0], sorted[1]]);
    return ethers.keccak256(combined);
  }

  /**
   * Build the complete Merkle tree
   */
  private buildTree(leaves: string[]): string[][] {
    if (leaves.length === 0) {
      throw new Error('Cannot build tree with no leaves');
    }

    const layers: string[][] = [leaves];
    
    while (layers[layers.length - 1].length > 1) {
      const currentLayer = layers[layers.length - 1];
      const nextLayer: string[] = [];

      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          // Pair exists
          nextLayer.push(this.hashPair(currentLayer[i], currentLayer[i + 1]));
        } else {
          // Odd number of nodes, duplicate the last one
          nextLayer.push(this.hashPair(currentLayer[i], currentLayer[i]));
        }
      }

      layers.push(nextLayer);
    }

    return layers;
  }

  /**
   * Get the Merkle root (top hash of the tree)
   */
  getRoot(): string {
    return this.layers[this.layers.length - 1][0];
  }

  /**
   * Generate a Merkle proof for a specific leaf
   */
  getProof(leaf: string): MerkleProof {
    const hashedLeaf = this.hash(leaf);
    let index = this.leaves.indexOf(hashedLeaf);

    if (index === -1) {
      throw new Error('Leaf not found in tree');
    }

    const proof: string[] = [];

    // Traverse up the tree, collecting sibling hashes
    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = index % 2 === 1;
      const siblingIndex = isRightNode ? index - 1 : index + 1;

      if (siblingIndex < layer.length) {
        proof.push(layer[siblingIndex]);
      } else {
        // Duplicate node if odd number
        proof.push(layer[index]);
      }

      index = Math.floor(index / 2);
    }

    return {
      leaf: hashedLeaf,
      proof,
      root: this.getRoot()
    };
  }

  /**
   * Verify a Merkle proof
   */
  static verify(proof: MerkleProof): boolean {
    let hash = proof.leaf;

    for (const sibling of proof.proof) {
      const sorted = [hash, sibling].sort();
      const combined = ethers.concat([sorted[0], sorted[1]]);
      hash = ethers.keccak256(combined);
    }

    return hash === proof.root;
  }

  /**
   * Get all leaves in the tree
   */
  getLeaves(): string[] {
    return [...this.leaves];
  }

  /**
   * Get the number of leaves
   */
  getLeafCount(): number {
    return this.leaves.length;
  }
}

/**
 * Helper function to create a batch Merkle tree from product data
 */
export function createBatchMerkleTree(products: {
  id: string;
  code: string;
  type: string;
  timestamp: number;
}[]): MerkleTree {
  // Create deterministic data strings for each product
  const dataStrings = products.map(p => 
    `${p.id}|${p.code}|${p.type}|${p.timestamp}`
  );
  
  return new MerkleTree(dataStrings);
}

/**
 * Helper function to verify product authenticity using Merkle proof
 */
export function verifyProductInBatch(
  productData: string,
  proof: MerkleProof
): boolean {
  return MerkleTree.verify(proof);
}
