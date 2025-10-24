"use client";

import { useState } from "react";
import CandidateList from "./CandidateList";
import ProposalVoterManagement from "./ProposalVoterManagement";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useAccount } from "wagmi";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

interface ProposalCardProps {
  proposalId: bigint;
}

export default function ProposalCard({ proposalId }: ProposalCardProps) {
  const { address: connectedAddress } = useAccount();
  const [showDetails, setShowDetails] = useState(false);
  const [showVoterManagement, setShowVoterManagement] = useState(false);
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

  const {} = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "registeredVoters",
    args: [connectedAddress],
  });

  const { data: isRegisteredForProposal } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "isVoterRegisteredForProposal",
    args: [proposalId, connectedAddress],
  });

  if (!proposal) return null;

  const [, title, description, creator, startTime, endTime, finalized, totalVotes] = proposal;
  const now = Math.floor(Date.now() / 1000);
  const isActive = now >= Number(startTime) && now <= Number(endTime) && !finalized;
  const hasEnded = now > Number(endTime);
  const isCreator = connectedAddress && creator && connectedAddress.toLowerCase() === creator.toLowerCase();

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
            <span>Начало:</span>
            <span>
              {formatDistanceToNow(new Date(Number(startTime) * 1000), {
                addSuffix: true,
                locale: ru,
              })}
            </span>
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

        {!isRegisteredForProposal && connectedAddress && !isCreator && (
          <div className="alert alert-warning mt-2">
            <span>⚠️ Вы не зарегистрированы для этого голосования. Обратитесь к создателю голосования.</span>
          </div>
        )}

        {isCreator && (
          <div className="alert alert-info mt-2">
            <span>👑 Вы создатель этого голосования</span>
          </div>
        )}

        <div className="card-actions justify-between mt-4">
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? "Скрыть" : "Подробнее"}
            </button>
            {isCreator && (
              <button className="btn btn-secondary btn-sm" onClick={() => setShowVoterManagement(!showVoterManagement)}>
                {showVoterManagement ? "Скрыть управление" : "Управление участниками"}
              </button>
            )}
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 border-t pt-4">
            <CandidateList
              proposalId={proposalId}
              onSelectCandidate={setSelectedCandidate}
              selectedCandidate={selectedCandidate}
              showVoteButton={false}
              canVote={isActive && !hasVoted && isRegisteredForProposal}
            />
          </div>
        )}

        {showVoterManagement && (
          <div className="mt-4 border-t pt-4">
            <ProposalVoterManagement proposalId={proposalId} />
          </div>
        )}
      </div>
    </div>
  );
}
