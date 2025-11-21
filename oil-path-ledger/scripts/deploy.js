const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ChainTrackSupplyChain contract...");

  // Get the contract factory
  const ChainTrackSupplyChain = await ethers.getContractFactory("ChainTrackSupplyChain");

  // Deploy the contract
  const chainTrackSupplyChain = await ChainTrackSupplyChain.deploy();

  // Wait for deployment to complete
  await chainTrackSupplyChain.waitForDeployment();
  const contractAddress = await chainTrackSupplyChain.getAddress();

  console.log("ChainTrackSupplyChain contract deployed to:", contractAddress);
  
  // Get deployment transaction
  const deployTx = chainTrackSupplyChain.deploymentTransaction();
  if (deployTx) {
    console.log("Transaction hash:", deployTx.hash);
  }

  // Verify the deployment
  console.log("Verifying deployment...");
  const code = await ethers.provider.getCode(contractAddress);
  if (code === "0x") {
    console.error("Contract deployment failed - no code at address");
    process.exit(1);
  } else {
    console.log("Contract successfully deployed!");
  }

  // Get network info
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "local" : network.name;

  // Save deployment info
  const deploymentInfo = {
    contractName: "ChainTrackSupplyChain",
    address: contractAddress,
    txHash: deployTx?.hash || "N/A",
    network: networkName,
    chainId: network.chainId.toString(),
    timestamp: new Date().toISOString(),
  };

  console.log("\n=== Deployment Summary ===");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  console.log("\n⚠️  IMPORTANT: Update the contract address in src/lib/blockchain.ts");
  console.log(`   CHAINTRACK_CONTRACT_ADDRESS = "${contractAddress}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });