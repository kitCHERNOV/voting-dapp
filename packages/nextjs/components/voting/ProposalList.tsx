"use client";

import ProposalCard from "./ProposalCard";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export default function ProposalList() {
  const { data: proposalCount } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "proposalCount",
  });

  const proposals = [];
  if (proposalCount) {
    for (let i = 1n; i <= proposalCount; i++) {
      proposals.push(i);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {proposals.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <p className="text-xl opacity-60">Нет активных голосований</p>
        </div>
      ) : (
        proposals.map(proposalId => <ProposalCard key={proposalId.toString()} proposalId={proposalId} />)
      )}
    </div>
  );
}
