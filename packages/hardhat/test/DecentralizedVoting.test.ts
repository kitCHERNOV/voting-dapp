import { expect } from "chai";
import { ethers } from "hardhat";
import { DecentralizedVoting } from "../typechain-types";

describe("DecentralizedVoting", function () {
  let voting: DecentralizedVoting;
  let owner: any;
  let voters: any[];
  const ONE_ETH = ethers.parseEther("1.0");

  before(async () => {
    [owner, ...voters] = await ethers.getSigners();

    // Создаем 5 дополнительных кошельков для тестирования
    if (voters.length < 5) {
      const Wallet = ethers.Wallet;
      voters = [];
      for (let i = 0; i < 5; i++) {
        const wallet = Wallet.createRandom().connect(owner.provider);
        voters.push(wallet);
      }
    } else {
      voters = voters.slice(0, 5);
    }

    // Деплоим контракт
    const votingFactory = await ethers.getContractFactory("DecentralizedVoting");
    voting = (await votingFactory.deploy()) as DecentralizedVoting;
    await voting.waitForDeployment();

    // Пополняем балансы всех участников
    for (const voter of voters) {
      await owner.sendTransaction({
        to: voter.address,
        value: ONE_ETH,
      });
    }
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const address = await voting.getAddress();
      expect(address).to.be.a("string");
      expect(address).to.have.length.greaterThan(0);
    });

    it("Should have the deployer as owner", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });

    it("Should have the deployer as registered voter", async function () {
      const isRegistered = await voting.isVoterGloballyRegistered(owner.address);
      expect(isRegistered).to.equal(true);
    });
  });

  describe("Proposal Management", function () {
    let proposalId: bigint;
    const proposalTitle = "Test Proposal";
    const proposalDescription = "This is a test proposal for voting";
    const duration = 1n; // 1 day

    it("Should create a proposal successfully", async function () {
      const tx = await voting.createProposal(proposalTitle, proposalDescription, duration);
      const receipt = await tx.wait();
      
      // Get the event
      const event = receipt?.logs.find(
        (log: any) => log.topics[0] === ethers.id("ProposalCreated(uint256,string,uint256,uint256)")
      );
      
      proposalId = BigInt(event?.topics[1] || "1");
      expect(Number(proposalId)).to.be.greaterThan(0);
    });

    it("Should retrieve proposal details correctly", async function () {
      const proposal = await voting.proposals(proposalId);
      expect(proposal.title).to.equal(proposalTitle);
      expect(proposal.description).to.equal(proposalDescription);
      expect(proposal.creator).to.equal(owner.address);
      expect(proposal.finalized).to.equal(false);
    });

    it("Should allow adding candidates before voting starts", async function () {
      const candidate1Name = "Candidate A";
      const candidate1Desc = "First candidate";
      const candidate2Name = "Candidate B";
      const candidate2Desc = "Second candidate";

      await voting.addCandidate(proposalId, candidate1Name, candidate1Desc);
      await voting.addCandidate(proposalId, candidate2Name, candidate2Desc);

      const candidates = await voting.getProposalCandidates(proposalId);
      expect(candidates.length).to.equal(2);
    });

    it("Should get correct candidate details", async function () {
      const candidates = await voting.getProposalCandidates(proposalId);
      const candidate = await voting.getCandidate(proposalId, candidates[0]);
      
      expect(candidate.name).to.be.a("string");
      expect(candidate.description).to.be.a("string");
      expect(candidate.voteCount).to.equal(0);
    });
  });

  describe("Voter Registration", function () {
    let proposalId: bigint;

    before(async () => {
      const tx = await voting.createProposal("Registration Test", "Testing registration", 1n);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.topics[0] === ethers.id("ProposalCreated(uint256,string,uint256,uint256)")
      );
      proposalId = BigInt(event?.topics[1] || "1");
    });

    it("Should allow voters to self-register for a proposal", async function () {
      for (const voter of voters) {
        const votingAsVoter = voting.connect(voter);
        await votingAsVoter.selfRegisterForProposal(proposalId);
        
        const isRegistered = await voting.isVoterRegisteredForProposal(proposalId, voter.address);
        expect(isRegistered).to.equal(true);
      }
    });

    it("Should prevent double registration", async function () {
      const votingAsVoter = voting.connect(voters[0]);
      await expect(
        votingAsVoter.selfRegisterForProposal(proposalId)
      ).to.be.revertedWith("You are already registered for this proposal");
    });

    it("Should allow owner to register voters for a proposal", async function () {
      const tx = await voting.createProposal("Owner Registration Test", "Testing owner registration", 1n);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.topics[0] === ethers.id("ProposalCreated(uint256,string,uint256,uint256)")
      );
      const newProposalId = BigInt(event?.topics[1] || "1");

      await voting.registerVoterForProposal(newProposalId, voters[0].address);
      const isRegistered = await voting.isVoterRegisteredForProposal(newProposalId, voters[0].address);
      expect(isRegistered).to.equal(true);
    });
  });

  describe("Full Voting Flow", function () {
    let proposalId: bigint;
    let candidateIds: bigint[];

    before(async () => {
      // Создаем новое голосование
      const tx = await voting.createProposal("Full Test Proposal", "Complete voting flow test", 1n);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.topics[0] === ethers.id("ProposalCreated(uint256,string,uint256,uint256)")
      );
      proposalId = BigInt(event?.topics[1] || "1");

      // Добавляем кандидатов
      await voting.addCandidate(proposalId, "Option A", "First option");
      await voting.addCandidate(proposalId, "Option B", "Second option");
      await voting.addCandidate(proposalId, "Option C", "Third option");

      const candidates = await voting.getProposalCandidates(proposalId);
      candidateIds = candidates;

      // Регистрируем всех участников
      for (const voter of voters) {
        const votingAsVoter = voting.connect(voter);
        await votingAsVoter.selfRegisterForProposal(proposalId);
      }
    });

    it("Should show all registered voters", async function () {
      for (const voter of voters) {
        const isRegistered = await voting.isVoterRegisteredForProposal(proposalId, voter.address);
        expect(isRegistered).to.equal(true);
      }
    });

    it("Should prevent voting before start time", async function () {
      const votingAsVoter = voting.connect(voters[0]);
      await expect(
        votingAsVoter.vote(proposalId, candidateIds[0])
      ).to.be.revertedWith("Voting has not started yet");
    });

    it("Should allow voting after start time", async function () {
      // Перемещаем время вперед на 6 минут (5 минут + 1 минута запас)
      await ethers.provider.send("evm_increaseTime", [6 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Голосуем от имени всех зарегистрированных участников
      for (let i = 0; i < voters.length; i++) {
        const votingAsVoter = voting.connect(voters[i]);
        const candidateId = candidateIds[i % candidateIds.length];
        
        await votingAsVoter.vote(proposalId, candidateId);
        
        const hasVoted = await voting.hasVoted(proposalId, voters[i].address);
        expect(hasVoted).to.equal(true);
      }
    });

    it("Should prevent double voting", async function () {
      const votingAsVoter = voting.connect(voters[0]);
      await expect(
        votingAsVoter.vote(proposalId, candidateIds[0])
      ).to.be.revertedWith("You have already voted");
    });

    it("Should calculate vote counts correctly", async function () {
      const results = await voting.getResults(proposalId);
      expect(results.totalVotes).to.equal(BigInt(voters.length));
      expect(results.candidateIds.length).to.equal(candidateIds.length);
    });

    it("Should allow finalizing proposal after voting ends", async function () {
      // Перемещаем время вперед на 2 дня
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      await voting.finalizeProposal(proposalId);
      
      const proposal = await voting.proposals(proposalId);
      expect(proposal.finalized).to.equal(true);
    });

    it("Should return the correct winner", async function () {
      const winner = await voting.getWinner(proposalId);
      expect(Number(winner)).to.be.greaterThan(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should prevent unauthorized voter from voting", async function () {
      // Создаем новое голосование
      const tx = await voting.createProposal("Edge Case Test", "Unauthorized voting test", 1n);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.topics[0] === ethers.id("ProposalCreated(uint256,string,uint256,uint256)")
      );
      const proposalId = BigInt(event?.topics[1] || "1");

      await voting.addCandidate(proposalId, "Candidate", "Test");

      // Перемещаем время вперед
      await ethers.provider.send("evm_increaseTime", [6 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Создаем нового, незарегистрированного участника
      const Wallet = ethers.Wallet;
      const unauthorizedVoter = Wallet.createRandom().connect(owner.provider);
      await owner.sendTransaction({
        to: unauthorizedVoter.address,
        value: ONE_ETH,
      });

      const votingAsUnauthorized = voting.connect(unauthorizedVoter);
      const candidates = await voting.getProposalCandidates(proposalId);
      
      await expect(
        votingAsUnauthorized.vote(proposalId, candidates[0])
      ).to.be.revertedWith("You must register yourself to vote. Use selfRegisterVoter() or selfRegisterForProposal()");
    });

    it("Should prevent adding candidates after voting starts", async function () {
      const tx = await voting.createProposal("Late Candidate Test", "Adding candidates late", 1n);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.topics[0] === ethers.id("ProposalCreated(uint256,string,uint256,uint256)")
      );
      const proposalId = BigInt(event?.topics[1] || "1");

      // Перемещаем время вперед
      await ethers.provider.send("evm_increaseTime", [6 * 60]);
      await ethers.provider.send("evm_mine", []);

      await expect(
        voting.addCandidate(proposalId, "Late Candidate", "Should not be added")
      ).to.be.revertedWith("Cannot add candidates after voting starts");
    });

    it("Should prevent voting after proposal is finalized", async function () {
      const tx = await voting.createProposal("Finalized Test", "Testing finalized proposal", 1n);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.topics[0] === ethers.id("ProposalCreated(uint256,string,uint256,uint256)")
      );
      const proposalId = BigInt(event?.topics[1] || "1");

      await voting.addCandidate(proposalId, "Candidate", "Test");
      
      // Перемещаем время вперед и финализируем
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60 + 6 * 60]);
      await ethers.provider.send("evm_mine", []);
      
      await voting.finalizeProposal(proposalId);

      // Попытка проголосовать после финализации
      const candidates = await voting.getProposalCandidates(proposalId);
      await expect(
        voting.vote(proposalId, candidates[0])
      ).to.be.revertedWith("Voting has ended");
    });
  });

  describe("Getter Functions", function () {
    it("Should return correct proposal count", async function () {
      const count = await voting.proposalCount();
      expect(Number(count)).to.be.greaterThan(0);
    });

    it("Should return correct candidate count", async function () {
      const count = await voting.candidateCount();
      expect(Number(count)).to.be.greaterThan(0);
    });

    it("Should return current timestamp", async function () {
      const timestamp = await voting.getCurrentTimestamp();
      expect(Number(timestamp)).to.be.greaterThan(0);
    });

    it("Should check if voter has voted in proposal", async function () {
      const tx = await voting.createProposal("Has Voted Test", "Testing has voted", 1n);
      const receipt = await tx.wait();
      const event = receipt?.logs.find(
        (log: any) => log.topics[0] === ethers.id("ProposalCreated(uint256,string,uint256,uint256)")
      );
      const proposalId = BigInt(event?.topics[1] || "1");

      await voting.addCandidate(proposalId, "Candidate", "Test");
      await voting.connect(voters[0]).selfRegisterForProposal(proposalId);

      await ethers.provider.send("evm_increaseTime", [6 * 60]);
      await ethers.provider.send("evm_mine", []);

      const candidates = await voting.getProposalCandidates(proposalId);
      await voting.connect(voters[0]).vote(proposalId, candidates[0]);

      const hasVoted = await voting.hasVotedInProposal(proposalId, voters[0].address);
      expect(hasVoted).to.equal(true);
    });
  });
});

