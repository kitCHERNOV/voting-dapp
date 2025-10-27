"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import AdminPanel from "~~/components/voting/AdminPanel";
import CreateProposal from "~~/components/voting/CreateProposal";
import ProposalList from "~~/components/voting/ProposalList";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export default function VotingPage() {
  const { address: connectedAddress } = useAccount();
  const [activeTab, setActiveTab] = useState<"vote" | "create" | "admin">("vote");

  const { data: owner } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "owner",
  });

  const isOwner = connectedAddress && owner && connectedAddress.toLowerCase() === owner.toLowerCase();

  return (
    <div className="flex flex-col items-center pt-10 px-5 min-h-screen">
      <div className="max-w-7xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🗳️ Децентрализованное Голосование</h1>
          <p className="text-lg opacity-70">Прозрачная система голосования на блокчейне</p>
          {connectedAddress && (
            <div className="mt-4 flex justify-center items-center gap-2">
              <span>Подключен:</span>
              <Address address={connectedAddress} />
              {isOwner && <span className="badge badge-primary">👑 Владелец</span>}
            </div>
          )}

        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed justify-center mb-8">
          <a className={`tab ${activeTab === "vote" ? "tab-active" : ""}`} onClick={() => setActiveTab("vote")}>
            📊 Голосования
          </a>
          <a className={`tab ${activeTab === "create" ? "tab-active" : ""}`} onClick={() => setActiveTab("create")}>
            ➕ Создать
          </a>
          {isOwner && (
            <a className={`tab ${activeTab === "admin" ? "tab-active" : ""}`} onClick={() => setActiveTab("admin")}>
              ⚙️ Админ
            </a>
          )}
        </div>

        {/* Content */}
        <div className="w-full">
          {activeTab === "vote" && <ProposalList />}
          {activeTab === "create" && <CreateProposal />}
          {activeTab === "admin" && isOwner && <AdminPanel />}
        </div>
      </div>
    </div>
  );
}
