import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployVoting: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("DecentralizedVoting", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const votingContract = await hre.ethers.getContract<Contract>("DecentralizedVoting", deployer);
  console.log("✅ DecentralizedVoting deployed at:", await votingContract.getAddress());
};

export default deployVoting;
deployVoting.tags = ["DecentralizedVoting"];
