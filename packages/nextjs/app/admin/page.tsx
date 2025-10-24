"use client";

import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import AdminPanel from "~~/components/voting/AdminPanel";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export default function AdminPage() {
  const { address: connectedAddress } = useAccount();

  const { data: owner } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "owner",
  });

  const isOwner = connectedAddress && owner && connectedAddress.toLowerCase() === owner.toLowerCase();

  if (!connectedAddress) {
    return (
      <div className="flex flex-col items-center pt-10 px-5 min-h-screen">
        <div className="max-w-4xl w-full text-center">
          <h1 className="text-4xl font-bold mb-4">🔐 Админ-панель</h1>
          <p className="text-lg opacity-70">Подключите кошелек для доступа к админ-панели</p>
        </div>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center pt-10 px-5 min-h-screen">
        <div className="max-w-4xl w-full text-center">
          <h1 className="text-4xl font-bold mb-4">🔐 Админ-панель</h1>
          <div className="alert alert-error max-w-md mx-auto">
            <span>❌ У вас нет прав доступа к админ-панели</span>
          </div>
          <div className="mt-4 text-sm opacity-60">
            <div>
              <span>Ваш адрес: </span>
              <Address address={connectedAddress} />
            </div>
            <div>
              <span>Владелец контракта: </span>
              {owner ? <Address address={owner} /> : "Загрузка..."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-10 px-5 min-h-screen">
      <div className="max-w-7xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🔐 Админ-панель</h1>
          <p className="text-lg opacity-70">Управление системой голосования</p>
          <div className="mt-4 flex justify-center items-center gap-2">
            <span>Владелец:</span>
            <Address address={connectedAddress} />
            <span className="badge badge-primary">👑 Администратор</span>
          </div>
        </div>

        <AdminPanel />
      </div>
    </div>
  );
}
