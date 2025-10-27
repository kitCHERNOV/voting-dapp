"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useBlockTimestamp, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface ProposalVoterManagementProps {
  proposalId: bigint;
}

export default function ProposalVoterManagement({ proposalId }: ProposalVoterManagementProps) {
  const { address: connectedAddress } = useAccount();
  const [voterAddress, setVoterAddress] = useState("");
  const [batchAddresses, setBatchAddresses] = useState("");

  const { data: proposal } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "proposals",
    args: [proposalId],
  });

  const { writeContractAsync, isPending: isRegistering } =
    useScaffoldWriteContract({ contractName: "DecentralizedVoting" });
  const isBatchRegistering = isRegistering;
  // const { writeContractAsync: deregisterVoterForProposal } =
  //   useScaffoldWriteContract("DecentralizedVoting");

  // Use blockchain timestamp for accurate time calculations
  const blockTimestamp = useBlockTimestamp();

  if (!proposal) return null;

  const [, , , creator, startTime, endTime, finalized] = proposal;
  const now = blockTimestamp;
  const isCreator = connectedAddress && creator && connectedAddress.toLowerCase() === creator.toLowerCase();
  const canManageVoters = isCreator && now < Number(startTime) && !finalized;

  const handleRegisterVoter = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!voterAddress) {
      notification.error("Введите адрес избирателя");
      return;
    }

    try {
      await writeContractAsync({
        functionName: "registerVoterForProposal",
        args: [proposalId, voterAddress as `0x${string}`],
      });
      notification.success("Избиратель зарегистрирован для этого голосования!");
      setVoterAddress("");
    } catch (e: any) {
      console.error("Error registering voter:", e);
      notification.error(e.message || "Ошибка регистрации");
    }
  };

  const handleBatchRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!batchAddresses.trim()) {
      notification.error("Введите адреса избирателей");
      return;
    }

    const addresses = batchAddresses
      .split(/[,\n]/)
      .map(addr => addr.trim())
      .filter(addr => addr.length > 0);

    if (addresses.length === 0) {
      notification.error("Не найдено валидных адресов");
      return;
    }

    try {
      await writeContractAsync({
        functionName: "registerVotersBatchForProposal",
        args: [proposalId, addresses as `0x${string}`[]],
      });
      notification.success(`${addresses.length} избирателей зарегистрировано!`);
      setBatchAddresses("");
    } catch (e: any) {
      console.error("Error batch registering voters:", e);
      notification.error(e.message || "Ошибка массовой регистрации");
    }
  };

  // const handleDeregisterVoter = async (address: string) => {
  //   try {
  //     await deregisterVoterForProposal({
  //       functionName: "deregisterVoterForProposal",
  //       args: [proposalId, address as `0x${string}`],
  //     });
  //     notification.success("Избиратель исключен из голосования");
  //   } catch (e: any) {
  //     console.error("Error deregistering voter:", e);
  //     notification.error(e.message || "Ошибка исключения");
  //   }
  // };

  if (!isCreator) {
    return (
      <div className="alert alert-info">
        <span>ℹ️ Только создатель голосования может управлять участниками</span>
      </div>
    );
  }

  if (!canManageVoters) {
    const timeUntilStart = Number(startTime) - now;
    const timeUntilEnd = Number(endTime) - now;

    return (
      <div className="space-y-4">
        <div className="alert alert-warning">
          <span>⚠️ Управление участниками возможно только до начала голосования</span>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Временная информация</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Начало голосования:</span>
                <span className="font-mono">{new Date(Number(startTime) * 1000).toLocaleString("ru-RU")}</span>
              </div>
              <div className="flex justify-between">
                <span>Окончание голосования:</span>
                <span className="font-mono">{new Date(Number(endTime) * 1000).toLocaleString("ru-RU")}</span>
              </div>
              {timeUntilStart > 0 && (
                <div className="flex justify-between">
                  <span>До начала:</span>
                  <span className="text-warning">
                    {Math.floor(timeUntilStart / 60)} мин {timeUntilStart % 60} сек
                  </span>
                </div>
              )}
              {timeUntilStart <= 0 && timeUntilEnd > 0 && (
                <div className="flex justify-between">
                  <span>До окончания:</span>
                  <span className="text-info">
                    {Math.floor(timeUntilEnd / 60)} мин {timeUntilEnd % 60} сек
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Временная информация */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">⏰ Временная информация</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Начало:</span>
                <span className="font-mono text-sm">{new Date(Number(startTime) * 1000).toLocaleString("ru-RU")}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Окончание:</span>
                <span className="font-mono text-sm">{new Date(Number(endTime) * 1000).toLocaleString("ru-RU")}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">До начала:</span>
                <span className="text-warning font-bold">
                  {Math.floor((Number(startTime) - now) / 60)} мин {(Number(startTime) - now) % 60} сек
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Длительность:</span>
                <span className="text-info">
                  {Math.floor((Number(endTime) - Number(startTime)) / 3600)} ч{" "}
                  {Math.floor(((Number(endTime) - Number(startTime)) % 3600) / 60)} мин
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Регистрация участника</h3>
          <form onSubmit={handleRegisterVoter} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Адрес избирателя</span>
              </label>
              <input
                type="text"
                placeholder="0x..."
                className="input input-bordered"
                value={voterAddress}
                onChange={e => setVoterAddress(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isRegistering || !voterAddress}>
              {isRegistering ? "Регистрация..." : "Зарегистрировать"}
            </button>
          </form>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Массовая регистрация</h3>
          <form onSubmit={handleBatchRegister} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Адреса избирателей (через запятую или с новой строки)</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="0x123..., 0x456..., 0x789..."
                value={batchAddresses}
                onChange={e => setBatchAddresses(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-secondary" disabled={isBatchRegistering || !batchAddresses.trim()}>
              {isBatchRegistering ? "Регистрация..." : "Зарегистрировать всех"}
            </button>
          </form>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">Управление участниками</h3>
          <div className="text-sm opacity-70 mb-4">
            <span>Создатель голосования: </span>
            <Address address={creator} />
          </div>
          <div className="alert alert-info">
            <span>ℹ️ Функция просмотра зарегистрированных участников будет добавлена в следующей версии</span>
          </div>
        </div>
      </div>
    </div>
  );
}
