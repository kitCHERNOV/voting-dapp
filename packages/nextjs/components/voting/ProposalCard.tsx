"use client";

import { useState } from "react";
import CandidateList from "./CandidateList";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface ProposalCardProps {
  proposalId: bigint;
}

export default function ProposalCard({ proposalId }: ProposalCardProps) {
  const { address: connectedAddress } = useAccount();
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<bigint | null>(null);

  const { data: proposal } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "proposals",
    args: [proposalId],
  });

  const { data: hasVoted } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "hasVoted",
    args: [proposalId, connectedAddress],
  });

  const { data: isRegistered } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "registeredVoters",
    args: [connectedAddress],
  });

  const { writeContractAsync: vote, isPending: isVoting } = useScaffoldWriteContract("DecentralizedVoting");

  if (!proposal) return null;

  const [, title, description, startTime, endTime, finalized, totalVotes] = proposal;
  const now = Math.floor(Date.now() / 1000);
  const isActive = now >= Number(startTime) && now <= Number(endTime) && !finalized;
  const hasEnded = now > Number(endTime);

  const handleVote = async () => {
    if (!selectedCandidate) return;

    try {
      await vote({
        functionName: "vote",
        args: [proposalId, selectedCandidate],
      });
      setSelectedCandidate(null);
    } catch (e) {
      console.error("Error voting:", e);
    }
  };

  const getStatusBadge = () => {
    if (finalized) return <span className="badge badge-neutral">Завершено</span>;
    if (isActive) return <span className="badge badge-success">Активно</span>;
    if (hasEnded) return <span className="badge badge-warning">Ожидает завершения</span>;
    return <span className="badge badge-info">Скоро</span>;
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-start">
          <h2 className="card-title">{title}</h2>
          {getStatusBadge()}
        </div>

        <p className="text-sm opacity-70">{description}</p>

        <div className="text-sm mt-2">
          <div className="flex justify-between">
            <span>Всего голосов:</span>
            <span className="font-bold">{totalVotes?.toString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Окончание:</span>
            <span>
              {formatDistanceToNow(new Date(Number(endTime) * 1000), {
                addSuffix: true,
                locale: ru,
              })}
            </span>
          </div>
        </div>

        {hasVoted && (
          <div className="alert alert-success mt-2">
            <span>✓ Вы проголосовали</span>
          </div>
        )}

        {!isRegistered && connectedAddress && (
          <div className="alert alert-warning mt-2">
            <span>⚠️ Вы не зарегистрированы для голосования. Обратитесь к администратору.</span>
          </div>
        )}

        <div className="card-actions justify-end mt-4">
          <button className="btn btn-primary btn-sm" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? "Скрыть" : "Подробнее"}
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 border-t pt-4">
            <CandidateList
              proposalId={proposalId}
              onSelectCandidate={setSelectedCandidate}
              selectedCandidate={selectedCandidate}
              showVoteButton={isActive && !hasVoted && isRegistered}
            />

            {isActive && !hasVoted && isRegistered && (
              <button
                className="btn btn-success w-full mt-4"
                onClick={handleVote}
                disabled={!selectedCandidate || isVoting}
              >
                {isVoting ? "Голосование..." : "Проголосовать"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
