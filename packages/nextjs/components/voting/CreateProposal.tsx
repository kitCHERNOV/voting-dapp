"use client";

import { useState } from "react";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export default function CreateProposal() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("7");
  const [candidates, setCandidates] = useState<Array<{ name: string; description: string }>>([
    { name: "", description: "" },
    { name: "", description: "" },
  ]);

  const { writeContractAsync, isPending: isCreating } = useScaffoldWriteContract({ contractName: "DecentralizedVoting" });

  const { data: proposalCount } = useScaffoldReadContract({
    contractName: "DecentralizedVoting",
    functionName: "proposalCount",
  });

  const addCandidateField = () => {
    setCandidates([...candidates, { name: "", description: "" }]);
  };

  const removeCandidateField = (index: number) => {
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const updateCandidate = (index: number, field: "name" | "description", value: string) => {
    const updated = [...candidates];
    updated[index][field] = value;
    setCandidates(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || candidates.some(c => !c.name)) {
      notification.error("Заполните все обязательные поля");
      return;
    }

    try {
      // Создаем голосование
      await writeContractAsync({
        functionName: "createProposal",
        args: [title, description, BigInt(duration)],
      });

      // Получаем новый ID голосования (proposalCount увеличится на 1)
      const newProposalId = proposalCount ? proposalCount + 1n : 1n;

      notification.success("Голосование создано!");

      // Добавляем кандидатов
      for (const candidate of candidates) {
        if (candidate.name) {
          await writeContractAsync({
            functionName: "addCandidate",
            args: [newProposalId, candidate.name, candidate.description],
          });
        }
      }

      notification.success("Кандидаты добавлены!");

      // Очищаем форму
      setTitle("");
      setDescription("");
      setDuration("7");
      setCandidates([
        { name: "", description: "" },
        { name: "", description: "" },
      ]);
    } catch (e) {
      console.error("Error creating proposal:", e);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Создать новое голосование</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Название *</span>
              </label>
              <input
                type="text"
                placeholder="Выборы президента класса 2025"
                className="input input-bordered"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Описание *</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Описание голосования..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Длительность (дней) *</span>
              </label>
              <input
                type="number"
                min="1"
                className="input input-bordered"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                required
              />
            </div>

            <div className="divider">Кандидаты</div>

            {candidates.map((candidate, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Кандидат {index + 1}</h3>
                  {candidates.length > 2 && (
                    <button type="button" className="btn btn-error btn-xs" onClick={() => removeCandidateField(index)}>
                      Удалить
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Имя кандидата *"
                  className="input input-bordered w-full"
                  value={candidate.name}
                  onChange={e => updateCandidate(index, "name", e.target.value)}
                  required
                />

                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="Описание кандидата"
                  value={candidate.description}
                  onChange={e => updateCandidate(index, "description", e.target.value)}
                />
              </div>
            ))}

            <button type="button" className="btn btn-outline btn-sm" onClick={addCandidateField}>
              + Добавить кандидата
            </button>

            <div className="card-actions justify-end mt-6">
              <button type="submit" className="btn btn-primary" disabled={isCreating}>
                {isCreating ? "Создание..." : "Создать голосование"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
