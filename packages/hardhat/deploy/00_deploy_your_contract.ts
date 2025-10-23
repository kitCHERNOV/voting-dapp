import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("🚀 Deploying Voting contract...");

  // Deploy the Voting contract
  const voting = await deploy("Voting", {
    from: deployer,
    args: [], // No constructor arguments
    log: true,
    autoMine: true,
  });

  console.log("✅ Voting contract deployed at:", voting.address);

  // Create test voting sessions
  if (voting.newlyDeployed) {
    const votingContract = await hre.ethers.getContract("Voting", deployer);
    
    // Create a simple voting session
    const tx1 = await votingContract.createVotingSession(
      "Best Project Selection",
      "Vote for the most interesting project",
      ["Project A", "Project B", "Project C"],
      ["A revolutionary blockchain project", "An innovative DeFi solution", "A creative NFT platform"],
      60, // 60 minutes
      false // No approval required
    );
    
    await tx1.wait();
    console.log("✅ Test voting session 1 created!");

    // Create a moderated voting session
    const tx2 = await votingContract.createVotingSession(
      "Community Proposal Voting",
      "Vote on community proposals (requires moderation)",
      ["Proposal 1", "Proposal 2"],
      ["Increase community rewards", "Change governance parameters"],
      120, // 120 minutes
      true // Requires approval
    );
    
    await tx2.wait();
    console.log("✅ Test voting session 2 created!");
  }
};

export default func;
func.tags = ["Voting"];