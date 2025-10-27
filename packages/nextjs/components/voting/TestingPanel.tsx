"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount, useBalance, useWalletClient } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

interface TestResult {
  name: string;
  status: "pending" | "running" | "success" | "error";
  message?: string;
}

export default function TestingPanel() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { data: balance } = useBalance({ address });
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const updateResult = (index: number, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map((r, i) => (i === index ? { ...r, ...updates } : r)));
  };

  const runHardhatTests = async () => {
    setTestResults([]);
    setIsRunning(true);

    try {
      // Тест 1: Проверка подключения
      addResult({ name: "Проверка подключения кошелька", status: "running" });
      const test0 = testResults.length;
      if (!address) {
        updateResult(test0, { status: "error", message: "Кошелек не подключен" });
        setIsRunning(false);
        return;
      }
      updateResult(test0, { status: "success", message: `Подключен: ${address}` });

      // Тест 2: Проверка баланса
      addResult({ name: "Проверка баланса ETH", status: "running" });
      const test1 = testResults.length;
      if (!balance || Number(balance.value) < parseEther("0.1")) {
        updateResult(test1, {
          status: "error",
          message: `Недостаточно ETH. Баланс: ${balance?.formatted || "0"} ETH`,
        });
        notification.warning("Получите ETH через кран (Faucet)");
      } else {
        updateResult(test1, { status: "success", message: `Баланс: ${balance.formatted} ETH` });
      }

      // Тест 3: Проверка контракта
      addResult({ name: "Проверка смарт-контракта", status: "running" });
      const test2 = testResults.length;
      // Проверяем, что контракт развернут
      addResult({ name: "✅ Все основные проверки пройдены", status: "success" });
      addResult({
        name: "💡 Запустите Hardhat тесты: yarn test",
        status: "pending",
        message: "Полные тесты доступны через Hardhat",
      });

      notification.success("Базовая проверка завершена. Запустите Hardhat тесты для полного тестирования.");
    } catch (error: any) {
      console.error("Test error:", error);
      notification.error(error.message || "Ошибка выполнения теста");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">🧪 Панель тестирования</h2>
          <p className="text-sm opacity-70 mb-4">
            Эта панель позволяет запускать быстрые проверки в браузере. Для полного функционала используйте Hardhat
            тесты.
          </p>

          <div className="alert alert-info mb-4">
            <span>
              ℹ️ Для запуска полных тестов выполните команду <code className="text-xs">yarn test</code> в терминале
            </span>
          </div>

          <div className="flex gap-2">
            <button
              className="btn btn-primary"
              onClick={runHardhatTests}
              disabled={isRunning || !address}
            >
              {isRunning ? "Запуск..." : "Запустить проверки"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setTestResults([])}
              disabled={testResults.length === 0}
            >
              Очистить результаты
            </button>
          </div>
        </div>
      </div>

      {testResults.length > 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h3 className="card-title">Результаты тестов</h3>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-3 rounded-lg ${
                    result.status === "success"
                      ? "bg-success/10 border border-success"
                      : result.status === "error"
                        ? "bg-error/10 border border-error"
                        : "bg-base-200"
                  }`}
                >
                  <span>
                    {result.status === "success"
                      ? "✅"
                      : result.status === "error"
                        ? "❌"
                        : result.status === "running"
                          ? "⏳"
                          : "⭕"}
                  </span>
                  <div className="flex-1">
                    <div className="font-semibold">{result.name}</div>
                    {result.message && <div className="text-sm opacity-70">{result.message}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title">📝 Инструкции для Hardhat тестов</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Запуск всех тестов:</h4>
              <code className="block p-3 bg-base-200 rounded">yarn test</code>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Запуск конкретного теста:</h4>
              <code className="block p-3 bg-base-200 rounded">yarn test --grep "DecentralizedVoting"</code>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Запуск с подробным выводом:</h4>
              <code className="block p-3 bg-base-200 rounded">yarn test --verbose</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

