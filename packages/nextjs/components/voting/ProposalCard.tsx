"use client";

import { useState } from "react";
import CandidateList from "./CandidateList";
import CompactCountdownTimer from "./CompactCountdownTimer";
import ProposalVoterManagement from "./ProposalVoterManagement";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useAccount } from "wagmi";
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

  const { data: isGloballyRegistered } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "registeredVoters",
    args: [connectedAddress],
  });

  const { data: isRegisteredForProposal } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "isVoterRegisteredForProposal",
    args: [proposalId, connectedAddress],
  });

  const { writeContractAsync: selfRegisterForProposal } = useScaffoldWriteContract("DecentralizedVoting");

  if (!proposal) return null;

  const [, title, description, creator, startTime, endTime, finalized, totalVotes] = proposal;
  // Use blockchain timestamp for accurate time calculations
  const now = blockTimestamp;
  const isActive = now >= Number(startTime) && now <= Number(endTime) && !finalized;
  const hasEnded = now > Number(endTime);
  const isCreator = connectedAddress && creator && connectedAddress.toLowerCase() === creator.toLowerCase();

  // User can vote if they are globally registered OR registered for this specific proposal
  const canVote = isGloballyRegistered || isRegisteredForProposal;
  const canSelfRegister = now < Number(startTime) && !finalized; // Can only register before voting starts

  const handleSelfRegisterForProposal = async () => {
    try {
      await selfRegisterForProposal({
        functionName: "selfRegisterForProposal",
        args: [proposalId],
      });
      notification.success("Вы успешно зарегистрированы для этого голосования!");
      window.location.reload();
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
            // Обновляем страницу когда голосование начинается
            window.location.reload();
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

          {/* Отладочная информация о времени */}
          <div className="text-xs opacity-60 mt-2 border-t pt-2">
            <div>Текущее время блокчейна: {new Date(now * 1000).toLocaleString()}</div>
            <div>Время начала голосования: {new Date(Number(startTime) * 1000).toLocaleString()}</div>
            <div>Время окончания: {new Date(Number(endTime) * 1000).toLocaleString()}</div>
            <div>Статус: {isActive ? "Активно" : hasEnded ? "Завершено" : "Ожидает начала"}</div>
            <div>isActive: {isActive ? "true" : "false"}</div>
            <div>hasVoted: {hasVoted ? "true" : "false"}</div>
            <div>canVote: {canVote ? "true" : "false"}</div>
            <div>canVote для CandidateList: {isActive && !hasVoted && canVote ? "true" : "false"}</div>
          </div>
        </div>

        {hasVoted && (
          <div className="alert alert-success mt-2">
            <span>✓ Вы проголосовали</span>
          </div>
        )}

        {!canVote && connectedAddress && !isCreator && (
          <div className="alert alert-warning mt-2">
            <div className="flex flex-col gap-2">
              <span>⚠️ Вы не зарегистрированы для этого голосования.</span>
              {canSelfRegister && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSelfRegisterForProposal}
                  disabled={isRegisteredForProposal}
                >
                  {isRegisteredForProposal ? "✓ Зарегистрирован" : "Зарегистрироваться для голосования"}
                </button>
              )}
              {!canSelfRegister && (
                <span className="text-sm opacity-70">Регистрация недоступна после начала голосования</span>
              )}
            </div>
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
              showVoteButton={true}
              canVote={isActive && !hasVoted && canVote}
              startTime={Number(startTime)}
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
