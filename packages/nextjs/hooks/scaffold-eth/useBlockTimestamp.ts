import { useScaffoldReadContract } from "./useScaffoldReadContract";

/**
 * Hook to get the current block timestamp from the blockchain
 * This is more accurate than using Date.now() for voting time calculations
 */
export const useBlockTimestamp = () => {
  const { data: blockTimestamp } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "getCurrentTimestamp",
  });

  // Return the blockchain timestamp if available, otherwise fallback to current time
  return blockTimestamp ? Number(blockTimestamp) : Math.floor(Date.now() / 1000);
};
