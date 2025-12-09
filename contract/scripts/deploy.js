const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment to Sepolia...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance === 0n) {
    throw new Error("❌ Insufficient balance! Please fund your account with Sepolia ETH.");
  }

  // Deploy EventManagement
  console.log("📄 Deploying EventManagement...");
  const EventManagement = await hre.ethers.getContractFactory("EventManagement");
  const eventManagement = await EventManagement.deploy();
  await eventManagement.waitForDeployment();
  const eventManagementAddress = await eventManagement.getAddress();
  console.log("✅ EventManagement deployed to:", eventManagementAddress);

  // Deploy RegistrationSBT
  console.log("\n📄 Deploying RegistrationSBT...");
  const RegistrationSBT = await hre.ethers.getContractFactory("RegistrationSBT");
  const registrationSBT = await RegistrationSBT.deploy(
    "Hackathon Registration SBT",
    "HACK-SBT"
  );
  await registrationSBT.waitForDeployment();
  const registrationSBTAddress = await registrationSBT.getAddress();
  console.log("✅ RegistrationSBT deployed to:", registrationSBTAddress);

  // Deploy CheckIn
  console.log("\n📄 Deploying CheckIn...");
  const CheckIn = await hre.ethers.getContractFactory("CheckIn");
  const checkIn = await CheckIn.deploy();
  await checkIn.waitForDeployment();
  const checkInAddress = await checkIn.getAddress();
  console.log("✅ CheckIn deployed to:", checkInAddress);
  
  // Transfer ownership to deployer (it's already the owner, but making it explicit)
  console.log("🔐 CheckIn owner:", await checkIn.owner());

  // Deploy SubmissionRegistry
  console.log("\n📄 Deploying SubmissionRegistry...");
  const SubmissionRegistry = await hre.ethers.getContractFactory("SubmissionRegistry");
  const submissionRegistry = await SubmissionRegistry.deploy();
  await submissionRegistry.waitForDeployment();
  const submissionRegistryAddress = await submissionRegistry.getAddress();
  console.log("✅ SubmissionRegistry deployed to:", submissionRegistryAddress);
  console.log("🔐 SubmissionRegistry owner:", await submissionRegistry.owner());

  // Note: PrizePool is deployed per event, so we don't deploy it here
  // It will be deployed when creating an event

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Deployment Summary");
  console.log("=".repeat(60));
  console.log("EventManagement:     ", eventManagementAddress);
  console.log("RegistrationSBT:    ", registrationSBTAddress);
  console.log("CheckIn:            ", checkInAddress);
  console.log("SubmissionRegistry: ", submissionRegistryAddress);
  console.log("=".repeat(60));
  console.log("\n📋 Next steps:");
  console.log("1. Save these addresses to your .env file");
  console.log("2. Update your frontend contract addresses");
  console.log("3. Verify contracts on Etherscan (optional):");
  console.log("   npx hardhat verify --network sepolia", eventManagementAddress);
  console.log("   npx hardhat verify --network sepolia", registrationSBTAddress);
  console.log("   npx hardhat verify --network sepolia", checkInAddress);
  console.log("   npx hardhat verify --network sepolia", submissionRegistryAddress);
  console.log("\n💡 Remember: PrizePool contracts are deployed per event!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

