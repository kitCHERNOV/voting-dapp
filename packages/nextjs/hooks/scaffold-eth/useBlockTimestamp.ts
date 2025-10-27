import { useScaffoldReadContract } from "./useScaffoldReadContract";

/**
 * Hook to get the current block timestamp from the blockchain
 * This is more accurate than using Date.now() for voting time calculations
 * Automatically refreshes every 5 seconds to keep timing accurate
 */
export const useBlockTimestamp = () => {
  const { data: blockTimestamp } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "getCurrentTimestamp",
    query: {
      refetchInterval: 5000, // Refresh every 5 seconds
    },
    watch: true,
  });

  // Return the blockchain timestamp if available, otherwise fallback to current time
  return blockTimestamp ? Number(blockTimestamp) : Math.floor(Date.now() / 1000);
};
