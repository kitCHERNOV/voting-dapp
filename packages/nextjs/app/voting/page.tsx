"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { Address } from "~~/components/scaffold-eth";

interface Proposal {
  name: string;
  description: string;
  voteCount: bigint;
  proposer: string;
}

interface SessionInfo {
  title: string;
  description: string;
  startTime: bigint;
  endTime: bigint;
  isActive: boolean;
  creator: string;
  totalVotes: bigint;
  requiresApproval: boolean;
}

export default function VotingPage() {
  const { address } = useAccount();
  const [selectedSession, setSelectedSession] = useState<number>(0);
  const [sessions, setSessions] = useState<number[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { writeContractAsync: writeVotingAsync } = useScaffoldWriteContract({
    contractName: "Voting",
  });

  // Get all sessions
  const { data: allSessions } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getAllSessions",
  });

  // Get session info
  const { data: sessionInfo } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getSessionInfo",
    args: [BigInt(selectedSession)],
  });

  // Get proposals for selected session
  const { data: proposals } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getProposals",
    args: [BigInt(selectedSession)],
  });

  // Check if user has voted
  const { data: hasVoted } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "hasVoted",
    args: [BigInt(selectedSession), address],
  });

  // Get winning proposal
  const { data: winningProposal } = useScaffoldReadContract({
    contractName: "Voting",
    functionName: "getWinningProposal",
    args: [BigInt(selectedSession)],
  });

  useEffect(() => {
    if (allSessions) {
      setSessions(allSessions);
    }
  }, [allSessions]);

  const handleVote = async (proposalId: number) => {
    if (!address) return;
    
    try {
      await writeVotingAsync({
        functionName: "vote",
        args: [BigInt(selectedSession), BigInt(proposalId)],
      });
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleCreateSession = async (formData: any) => {
    try {
      await writeVotingAsync({
        functionName: "createVotingSession",
        args: [
          formData.title,
          formData.description,
          formData.proposalNames,
          formData.proposalDescriptions,
          BigInt(formData.duration),
          formData.requiresApproval
        ],
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const formatTime = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const isSessionActive = (info: SessionInfo) => {
    const now = Math.floor(Date.now() / 1000);
    return info.isActive && now >= Number(info.startTime) && now <= Number(info.endTime);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Decentralized Voting System</h1>
        
        {/* Session Selector */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Voting Sessions</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              Create New Session
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((sessionId) => (
              <div
                key={sessionId}
                className={`card bg-base-200 cursor-pointer transition-all ${
                  selectedSession === Number(sessionId) ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedSession(Number(sessionId))}
              >
                <div className="card-body">
                  <h3 className="card-title">Session #{sessionId}</h3>
                  <p className="text-sm opacity-70">Click to view details</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session Details */}
        {sessionInfo && (
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h2 className="card-title text-2xl">{sessionInfo.title}</h2>
              <p className="text-base-content/70 mb-4">{sessionInfo.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p><strong>Creator:</strong> <Address address={sessionInfo.creator} /></p>
                  <p><strong>Start Time:</strong> {formatTime(sessionInfo.startTime)}</p>
                  <p><strong>End Time:</strong> {formatTime(sessionInfo.endTime)}</p>
                </div>
                <div>
                  <p><strong>Status:</strong> 
                    <span className={`badge ml-2 ${
                      isSessionActive(sessionInfo) ? "badge-success" : "badge-error"
                    }`}>
                      {isSessionActive(sessionInfo) ? "Active" : "Inactive"}
                    </span>
                  </p>
                  <p><strong>Total Votes:</strong> {sessionInfo.totalVotes.toString()}</p>
                  <p><strong>Requires Approval:</strong> 
                    <span className={`badge ml-2 ${
                      sessionInfo.requiresApproval ? "badge-warning" : "badge-info"
                    }`}>
                      {sessionInfo.requiresApproval ? "Yes" : "No"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Proposals */}
              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Proposals</h3>
                <div className="grid gap-4">
                  {proposals?.map((proposal: Proposal, index: number) => (
                    <div key={index} className="card bg-base-200">
                      <div className="card-body">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="card-title">{proposal.name}</h4>
                            <p className="text-sm opacity-70 mb-2">{proposal.description}</p>
                            <p className="text-sm">
                              <strong>Proposer:</strong> <Address address={proposal.proposer} />
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {proposal.voteCount.toString()}
                            </div>
                            <div className="text-sm opacity-70">votes</div>
                          </div>
                        </div>
                        
                        {isSessionActive(sessionInfo) && !hasVoted && (
                          <div className="card-actions justify-end mt-4">
                            <button
                              onClick={() => handleVote(index)}
                              className="btn btn-primary btn-sm"
                            >
                              Vote
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Voting Status */}
                {hasVoted && (
                  <div className="alert alert-info mt-4">
                    <span>You have already voted in this session.</span>
                  </div>
                )}

                {/* Winning Proposal */}
                {winningProposal && !isSessionActive(sessionInfo) && (
                  <div className="alert alert-success mt-4">
                    <span>
                      <strong>Winner:</strong> {proposals?.[Number(winningProposal[0])]?.name} 
                      with {winningProposal[1].toString()} votes
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Create Session Modal */}
        {showCreateForm && (
          <CreateSessionModal
            onSubmit={handleCreateSession}
            onClose={() => setShowCreateForm(false)}
          />
        )}
      </div>
    </div>
  );
}

function CreateSessionModal({ onSubmit, onClose }: { onSubmit: (data: any) => void, onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    proposalNames: ["", ""],
    proposalDescriptions: ["", ""],
    duration: 60,
    requiresApproval: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addProposal = () => {
    setFormData({
      ...formData,
      proposalNames: [...formData.proposalNames, ""],
      proposalDescriptions: [...formData.proposalDescriptions, ""]
    });
  };

  const removeProposal = (index: number) => {
    if (formData.proposalNames.length > 2) {
      setFormData({
        ...formData,
        proposalNames: formData.proposalNames.filter((_, i) => i !== index),
        proposalDescriptions: formData.proposalDescriptions.filter((_, i) => i !== index)
      });
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Create New Voting Session</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Title</span>
            </label>
            <input
              type="text"
              className="input input-bordered"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Duration (minutes)</span>
            </label>
            <input
              type="number"
              className="input input-bordered"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              min="1"
              required
            />
          </div>

          <div className="form-control mb-4">
            <label className="label cursor-pointer">
              <span className="label-text">Requires Proposal Approval</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
              />
            </label>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="label">
                <span className="label-text">Proposals</span>
              </label>
              <button type="button" onClick={addProposal} className="btn btn-sm btn-outline">
                Add Proposal
              </button>
            </div>
            
            {formData.proposalNames.map((name, index) => (
              <div key={index} className="card bg-base-200 mb-2">
                <div className="card-body">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Proposal {index + 1}</h4>
                    {formData.proposalNames.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeProposal(index)}
                        className="btn btn-sm btn-error"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    className="input input-bordered mb-2"
                    placeholder="Proposal name"
                    value={name}
                    onChange={(e) => {
                      const newNames = [...formData.proposalNames];
                      newNames[index] = e.target.value;
                      setFormData({ ...formData, proposalNames: newNames });
                    }}
                    required
                  />
                  <textarea
                    className="textarea textarea-bordered"
                    placeholder="Proposal description"
                    value={formData.proposalDescriptions[index]}
                    onChange={(e) => {
                      const newDescriptions = [...formData.proposalDescriptions];
                      newDescriptions[index] = e.target.value;
                      setFormData({ ...formData, proposalDescriptions: newDescriptions });
                    }}
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="modal-action">
            <button type="button" onClick={onClose} className="btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
