const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ChainTrackSupplyChain contract...");

  // Get signers
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    throw new Error("No signers available. Please check your network configuration and PRIVATE_KEY in .env file.");
  }
  const deployer = signers[0];
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Get the contract factory
  const ChainTrackSupplyChain = await ethers.getContractFactory("ChainTrackSupplyChain", deployer);

  // Deploy the contract
  console.log("Deploying contract...");
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

