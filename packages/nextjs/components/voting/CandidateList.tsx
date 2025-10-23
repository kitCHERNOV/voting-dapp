"use client";

import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface CandidateListProps {
  proposalId: bigint;
  onSelectCandidate?: (candidateId: bigint) => void;
  selectedCandidate?: bigint | null;
  showVoteButton?: boolean;
}

export default function CandidateList({
  proposalId,
  onSelectCandidate,
  selectedCandidate,
  showVoteButton = false,
}: CandidateListProps) {
  const { data: candidateIds } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "getProposalCandidates",
    args: [proposalId],
  });

  const { data: results } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "getResults",
    args: [proposalId],
  });

  if (!candidateIds || candidateIds.length === 0) {
    return <p className="text-center opacity-60">Нет кандидатов</p>;
  }

  const totalVotes = results ? Number(results[2]) : 0;

  return (
    <div className="space-y-2">
      <h3 className="font-bold mb-2">Кандидаты:</h3>
      {candidateIds.map((candidateId, index) => {
        const voteCount = results ? Number(results[1][index]) : 0;
        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
        const isSelected = selectedCandidate?.toString() === candidateId.toString();

        return (
          <CandidateItem
            key={candidateId.toString()}
            proposalId={proposalId}
            candidateId={candidateId}
            voteCount={voteCount}
            percentage={percentage}
            isSelected={isSelected}
            onSelect={showVoteButton ? onSelectCandidate : undefined}
          />
        );
      })}
    </div>
  );
}

interface CandidateItemProps {
  proposalId: bigint;
  candidateId: bigint;
  voteCount: number;
  percentage: number;
  isSelected: boolean;
  onSelect?: (candidateId: bigint) => void;
}

function CandidateItem({ proposalId, candidateId, voteCount, percentage, isSelected, onSelect }: CandidateItemProps) {
  const { data: candidate } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "getCandidate",
    args: [proposalId, candidateId],
  });

  if (!candidate) return null;

  const [, name, description] = candidate;

  return (
    <div
      className={`border rounded-lg p-3 hover:bg-base-200 transition-colors cursor-pointer ${
        isSelected ? "border-primary bg-primary/10" : ""
      }`}
      onClick={() => onSelect && onSelect(candidateId)}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold">{name}</h4>
          <p className="text-sm opacity-70">{description}</p>
        </div>
        <div className="text-right">
          <div className="font-bold">{voteCount}</div>
          <div className="text-sm opacity-70">{percentage.toFixed(1)}%</div>
        </div>
      </div>
      <progress className="progress progress-primary w-full" value={percentage} max="100" />
    </div>
  );
}
