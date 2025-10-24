"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface CandidateListProps {
  proposalId: bigint;
  onSelectCandidate?: (candidateId: bigint) => void;
  selectedCandidate?: bigint | null;
  showVoteButton?: boolean;
  canVote?: boolean;
}

export default function CandidateList({
  proposalId,
  onSelectCandidate,
  selectedCandidate,
  showVoteButton = false,
  canVote = false,
}: CandidateListProps) {
  const { address: connectedAddress } = useAccount();
  const [votingCandidate, setVotingCandidate] = useState<bigint | null>(null);

  const { writeContractAsync: vote } = useScaffoldWriteContract("DecentralizedVoting");

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

  const { data: hasVoted } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "hasVoted",
    args: [proposalId, connectedAddress],
  });

  const handleVote = async (candidateId: bigint) => {
    if (!canVote || hasVoted) {
      notification.error("Вы не можете голосовать");
      return;
    }

    setVotingCandidate(candidateId);

    try {
      await vote({
        functionName: "vote",
        args: [proposalId, candidateId],
      });
      notification.success("Голос успешно отдан!");
      // Обновляем страницу для отображения новых результатов
      window.location.reload();
    } catch (e: any) {
      console.error("Error voting:", e);
      notification.error(e.message || "Ошибка голосования");
    } finally {
      setVotingCandidate(null);
    }
  };

  if (!candidateIds || candidateIds.length === 0) {
    return <p className="text-center opacity-60">Нет кандидатов</p>;
  }

  const totalVotes = results ? Number(results[2]) : 0;

  return (
    <div className="space-y-2">
      <h3 className="font-bold mb-2">Кандидаты:</h3>

      {/* Отладочная информация */}
      <div className="text-xs opacity-60 mb-2">
        canVote: {canVote ? "true" : "false"}, hasVoted: {hasVoted ? "true" : "false"}
      </div>

      {hasVoted && (
        <div className="alert alert-success mb-4">
          <span>✅ Вы уже проголосовали в этом голосовании</span>
        </div>
      )}
      {candidateIds.map((candidateId, index) => {
        const voteCount = results ? Number(results[1][index]) : 0;
        const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
        const isSelected = selectedCandidate?.toString() === candidateId.toString();
        const isVotingForThis = votingCandidate?.toString() === candidateId.toString();

        return (
          <CandidateItem
            key={candidateId.toString()}
            proposalId={proposalId}
            candidateId={candidateId}
            voteCount={voteCount}
            percentage={percentage}
            isSelected={isSelected}
            isVoting={isVotingForThis}
            canVote={canVote}
            onSelect={showVoteButton ? onSelectCandidate : undefined}
            onVote={canVote ? handleVote : undefined}
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
  isVoting?: boolean;
  canVote?: boolean;
  onSelect?: (candidateId: bigint) => void;
  onVote?: (candidateId: bigint) => void;
}

function CandidateItem({
  proposalId,
  candidateId,
  voteCount,
  percentage,
  isSelected,
  isVoting = false,
  canVote = false,
  onSelect,
  onVote,
}: CandidateItemProps) {
  const { data: candidate } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "getCandidate",
    args: [proposalId, candidateId],
  });

  if (!candidate) return null;

  const [, name, description] = candidate;

  const handleClick = () => {
    if (onVote && canVote) {
      onVote(candidateId);
    } else if (onSelect) {
      onSelect(candidateId);
    }
  };

  return (
    <div
      className={`border rounded-lg p-3 transition-all duration-200 ${
        canVote ? "hover:bg-base-200 cursor-pointer hover:shadow-md" : "cursor-default"
      } ${isSelected ? "border-primary bg-primary/10" : ""} ${isVoting ? "border-warning bg-warning/10" : ""}`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h4 className="font-semibold">{name}</h4>
          <p className="text-sm opacity-70">{description}</p>
        </div>
        <div className="text-right ml-4">
          <div className="font-bold">{voteCount}</div>
          <div className="text-sm opacity-70">{percentage.toFixed(1)}%</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <progress className="progress progress-primary w-full mr-4" value={percentage} max="100" />

        {canVote && onVote ? (
          <button
            className={`btn btn-sm ${isVoting ? "btn-warning loading" : "btn-primary"}`}
            onClick={e => {
              e.stopPropagation();
              onVote(candidateId);
            }}
            disabled={isVoting}
          >
            {isVoting ? "Голосование..." : "Голосовать"}
          </button>
        ) : (
          <div className="text-xs opacity-50">{!canVote ? "Не можете голосовать" : "Нет функции голосования"}</div>
        )}
      </div>
    </div>
  );
}
