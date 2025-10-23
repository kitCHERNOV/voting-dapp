"use client";

import { useState } from "react";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export default function AdminPanel() {
  const [voterAddress, setVoterAddress] = useState("");
  const [proposalIdToFinalize, setProposalIdToFinalize] = useState("");

  const { writeContractAsync: registerVoter, isPending: isRegistering } =
    useScaffoldWriteContract("DecentralizedVoting");
  const { writeContractAsync: finalizeProposal, isPending: isFinalizing } =
    useScaffoldWriteContract("DecentralizedVoting");

  const { data: proposalCount } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "proposalCount",
  });

  const handleRegisterVoter = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await registerVoter({
        functionName: "registerVoter",
        args: [voterAddress as `0x${string}`],
      });
      notification.success("Избиратель зарегистрирован!");
      setVoterAddress("");
    } catch (e: any) {
      console.error("Error registering voter:", e);
      notification.error(e.message || "Ошибка регистрации");
    }
  };

  const handleFinalizeProposal = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await finalizeProposal({
        functionName: "finalizeProposal",
        args: [BigInt(proposalIdToFinalize)],
      });
      notification.success("Голосование завершено!");
      setProposalIdToFinalize("");
    } catch (e: any) {
      console.error("Error finalizing proposal:", e);
      notification.error(e.message || "Ошибка завершения");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Регистрация избирателя */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Регистрация избирателя</h2>
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

      {/* Завершение голосования */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Завершить голосование</h2>
          <form onSubmit={handleFinalizeProposal} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">ID голосования</span>
              </label>
              <select
                className="select select-bordered"
                value={proposalIdToFinalize}
                onChange={e => setProposalIdToFinalize(e.target.value)}
                required
              >
                <option value="">Выберите голосование</option>
                {proposalCount &&
                  Array.from({ length: Number(proposalCount) }, (_, i) => i + 1).map(id => (
                    <option key={id} value={id}>
                      Голосование #{id}
                    </option>
                  ))}
              </select>
            </div>
            <button type="submit" className="btn btn-warning" disabled={isFinalizing || !proposalIdToFinalize}>
              {isFinalizing ? "Завершение..." : "Завершить голосование"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
