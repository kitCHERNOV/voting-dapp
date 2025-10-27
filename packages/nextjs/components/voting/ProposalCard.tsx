"use client";

import { useState } from "react";
import CandidateList from "./CandidateList";
import CompactCountdownTimer from "./CompactCountdownTimer";
import ProposalVoterManagement from "./ProposalVoterManagement";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useBlockTimestamp, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface ProposalCardProps {
  proposalId: bigint;
}

export default function ProposalCard({ proposalId }: ProposalCardProps) {
  const { address: connectedAddress } = useAccount();
  const [showDetails, setShowDetails] = useState(false);
  const [showVoterManagement, setShowVoterManagement] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<bigint | null>(null);
  const queryClient = useQueryClient();

  // Use blockchain timestamp instead of client time
  const blockTimestamp = useBlockTimestamp();

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

  const { data: isRegisteredForProposal } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "isVoterRegisteredForProposal",
    args: [proposalId, connectedAddress],
  });

  const { writeContractAsync } = useScaffoldWriteContract({ contractName: "DecentralizedVoting" });

  if (!proposal) return null;

  const [, title, description, creator, startTime, endTime, finalized, totalVotes] = proposal;
  // Use blockchain timestamp for accurate time calculations
  const now = blockTimestamp;
  const isActive = now >= Number(startTime) && now <= Number(endTime) && !finalized;
  const hasEnded = now > Number(endTime);
  const isCreator = connectedAddress && creator && connectedAddress.toLowerCase() === creator.toLowerCase();

  // User can vote only if they're registered for this proposal AND haven't voted yet AND voting is active
  const canVote = connectedAddress && isRegisteredForProposal && isActive && !hasVoted;
  // Registration is only allowed BEFORE voting starts
  const canRegister = connectedAddress && !isRegisteredForProposal && now < Number(startTime) && !finalized;
  // Show candidates only if registered
  const shouldShowCandidates = isRegisteredForProposal;

  const handleSelfRegisterForProposal = async () => {
    try {
      await writeContractAsync({
        functionName: "selfRegisterForProposal",
        args: [proposalId],
      });
      
      // Invalidate queries to force refetch
      queryClient.invalidateQueries();
      
      notification.success("Вы успешно зарегистрированы для этого голосования!");
    } catch (e: any) {
      console.error("Error self-registering for proposal:", e);
      notification.error(e.message || "Ошибка регистрации");
    }
  };


  const getStatusBadge = () => {
    if (finalized) return <span className="badge badge-neutral">Завершено</span>;
    if (isActive) return <span className="badge badge-success">Активно</span>;
    if (hasEnded) return <span className="badge badge-warning">Ожидает завершения</span>;
    return (
      <div className="flex items-center gap-2">
        <span className="badge badge-info">Начинается через:</span>
        <CompactCountdownTimer
          targetTime={Number(startTime)}
          onComplete={() => {
            // Auto-update handled by wagmi cache
          }}
        />
      </div>
    );
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
            <div className="text-right">
              <div>
                {formatDistanceToNow(new Date(Number(startTime) * 1000), {
                  addSuffix: true,
                  locale: ru,
                })}
              </div>
              {!isActive && !hasEnded && (
                <CompactCountdownTimer targetTime={Number(startTime)} className="text-xs opacity-70" />
              )}
            </div>
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

        {!connectedAddress && (
          <div className="alert alert-warning mt-2">
            <span>⚠️ Подключите кошелек для голосования</span>
          </div>
        )}

        {canRegister && connectedAddress && !isRegisteredForProposal && (
          <div className="alert alert-warning mt-2">
            <div className="flex flex-col gap-2">
              <span>⚠️ Зарегистрируйтесь для участия в голосовании (до начала)</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSelfRegisterForProposal}
                disabled={isRegisteredForProposal}
              >
                {isRegisteredForProposal ? "✓ Зарегистрирован" : "Зарегистрироваться для голосования"}
              </button>
            </div>
          </div>
        )}

        {!canRegister && !isRegisteredForProposal && connectedAddress && !hasEnded && isActive && (
          <div className="alert alert-error mt-2">
            <span>❌ Вы не успели зарегистрироваться до начала голосования. Регистрация закрыта.</span>
          </div>
        )}

        {hasEnded && !isRegisteredForProposal && connectedAddress && (
          <div className="alert alert-error mt-2">
            <span>❌ Голосование завершено. Регистрация больше невозможна.</span>
          </div>
        )}

        {isRegisteredForProposal && !isActive && !hasVoted && connectedAddress && !hasEnded && (
          <div className="alert alert-success mt-2">
            <span>✅ Вы зарегистрированы! Голосование начнется {formatDistanceToNow(new Date(Number(startTime) * 1000), { addSuffix: true, locale: ru })}</span>
          </div>
        )}

        {hasVoted && (
          <div className="alert alert-success mt-2">
            <span>✓ Вы проголосовали</span>
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
            {shouldShowCandidates ? (
              <CandidateList
                proposalId={proposalId}
                onSelectCandidate={setSelectedCandidate}
                selectedCandidate={selectedCandidate}
                showVoteButton={canVote}
                canVote={canVote}
                hasEnded={hasEnded}
              />
            ) : (
              <div className="alert alert-warning">
                <span>⚠️ Необходимо зарегистрироваться для участия в голосовании</span>
              </div>
            )}
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
