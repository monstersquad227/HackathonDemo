const hre = require("hardhat");

/**
 * Deploy PrizePool for a specific event
 * Usage: npx hardhat run scripts/deploy-prizepool.js --network sepolia
 * 
 * You can also pass eventId and eventContractAddress as environment variables:
 * EVENT_ID=1 EVENT_CONTRACT_ADDRESS=0x... npx hardhat run scripts/deploy-prizepool.js --network sepolia
 */
async function main() {
  const eventId = process.env.EVENT_ID || "1";
  const eventContractAddress = process.env.EVENT_CONTRACT_ADDRESS || "";

  if (!eventContractAddress) {
    throw new Error("❌ EVENT_CONTRACT_ADDRESS environment variable is required!");
  }

  console.log("🚀 Deploying PrizePool for event:", eventId);
  console.log("📝 EventManagement contract:", eventContractAddress);

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const PrizePool = await hre.ethers.getContractFactory("PrizePool");
  const prizePool = await PrizePool.deploy(eventId, eventContractAddress);
  await prizePool.waitForDeployment();
  const prizePoolAddress = await prizePool.getAddress();

  console.log("\n✅ PrizePool deployed to:", prizePoolAddress);
  console.log("📋 Event ID:", await prizePool.eventId());
  console.log("📋 Event Contract:", await prizePool.eventContract());
  console.log("🔐 Owner:", await prizePool.owner());

  console.log("\n💡 Save this address for your event's funding pool!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

