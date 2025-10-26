// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DecentralizedVoting
 * @dev Fully decentralized voting contract where users can self-register without owner approval
 * Users can register themselves globally or for specific proposals
 */
contract DecentralizedVoting {
    
    struct Candidate {
        uint256 id;
        string name;
        string description;
        uint256 voteCount;
        bool exists;
    }
    
    struct Proposal {
        uint256 id;
        string title;
        string description;
        address creator;
        uint256 startTime;
        uint256 endTime;
        bool finalized;
        uint256 totalVotes;
        uint256[] candidateIds;
    }
    
    address public owner;
    uint256 public proposalCount;
    uint256 public candidateCount;
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(uint256 => Candidate)) public proposalCandidates;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint256)) public voterChoice;
    mapping(uint256 => mapping(address => bool)) public proposalVoters; // proposalId => voter => isRegistered
    mapping(address => bool) public registeredVoters;
    
    event ProposalCreated(uint256 indexed proposalId, string title, uint256 startTime, uint256 endTime);
    event CandidateAdded(uint256 indexed proposalId, uint256 indexed candidateId, string name);
    event VoteCast(uint256 indexed proposalId, address indexed voter, uint256 indexed candidateId);
    event ProposalFinalized(uint256 indexed proposalId, uint256 winningCandidateId);
    event VoterRegistered(address indexed voter);
    event VoterDeregistered(address indexed voter);
    event VoterRegisteredForProposal(uint256 indexed proposalId, address indexed voter);
    event VoterDeregisteredForProposal(uint256 indexed proposalId, address indexed voter);
    event VotingStarted(uint256 indexed proposalId, uint256 startTime);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyRegisteredVoter() {
        require(registeredVoters[msg.sender], "You are not registered to vote");
        _;
    }
    
    modifier onlyProposalCreator(uint256 _proposalId) {
        require(proposals[_proposalId].creator == msg.sender, "Only proposal creator can perform this action");
        _;
    }
    
    modifier canVoteInProposal(uint256 _proposalId) {
        require(
            proposalVoters[_proposalId][msg.sender] || registeredVoters[msg.sender], 
            "You must register yourself to vote. Use selfRegisterVoter() or selfRegisterForProposal()"
        );
        _;
    }
    
    modifier proposalExists(uint256 _proposalId) {
        require(_proposalId > 0 && _proposalId <= proposalCount, "Proposal does not exist");
        _;
    }
    
    modifier proposalActive(uint256 _proposalId) {
        require(block.timestamp >= proposals[_proposalId].startTime, "Voting has not started yet");
        require(block.timestamp <= proposals[_proposalId].endTime, "Voting has ended");
        require(!proposals[_proposalId].finalized, "Proposal already finalized");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        registeredVoters[msg.sender] = true;
    }
    
    // Optional: Owner can still register voters (for convenience)
    function registerVoter(address _voter) external onlyOwner {
        require(!registeredVoters[_voter], "Voter already registered");
        registeredVoters[_voter] = true;
        emit VoterRegistered(_voter);
    }
    
    // Main registration function: Users can register themselves
    function selfRegisterVoter() external {
        require(!registeredVoters[msg.sender], "You are already registered");
        registeredVoters[msg.sender] = true;
        emit VoterRegistered(msg.sender);
    }
    
    function registerVotersBatch(address[] calldata _voters) external onlyOwner {
        for (uint256 i = 0; i < _voters.length; i++) {
            if (!registeredVoters[_voters[i]]) {
                registeredVoters[_voters[i]] = true;
                emit VoterRegistered(_voters[i]);
            }
        }
    }
    
    function deregisterVoter(address _voter) external onlyOwner {
        require(registeredVoters[_voter], "Voter not registered");
        registeredVoters[_voter] = false;
        emit VoterDeregistered(_voter);
    }
    
    // Функции для регистрации участников конкретного голосования
    function registerVoterForProposal(uint256 _proposalId, address _voter) 
        external 
        proposalExists(_proposalId) 
        onlyProposalCreator(_proposalId) 
    {
        require(!proposalVoters[_proposalId][_voter], "Voter already registered for this proposal");
        require(block.timestamp < proposals[_proposalId].startTime, "Cannot register voters after voting starts");
        
        proposalVoters[_proposalId][_voter] = true;
        emit VoterRegisteredForProposal(_proposalId, _voter);
    }
    
    function registerVotersBatchForProposal(uint256 _proposalId, address[] calldata _voters) 
        external 
        proposalExists(_proposalId) 
        onlyProposalCreator(_proposalId) 
    {
        require(block.timestamp < proposals[_proposalId].startTime, "Cannot register voters after voting starts");
        
        for (uint256 i = 0; i < _voters.length; i++) {
            if (!proposalVoters[_proposalId][_voters[i]]) {
                proposalVoters[_proposalId][_voters[i]] = true;
                emit VoterRegisteredForProposal(_proposalId, _voters[i]);
            }
        }
    }
    
    function deregisterVoterForProposal(uint256 _proposalId, address _voter) 
        external 
        proposalExists(_proposalId) 
        onlyProposalCreator(_proposalId) 
    {
        require(proposalVoters[_proposalId][_voter], "Voter not registered for this proposal");
        require(block.timestamp < proposals[_proposalId].startTime, "Cannot deregister voters after voting starts");
        
        proposalVoters[_proposalId][_voter] = false;
        emit VoterDeregisteredForProposal(_proposalId, _voter);
    }
    
    // Users can register themselves for specific proposals
    function selfRegisterForProposal(uint256 _proposalId) 
        external 
        proposalExists(_proposalId) 
    {
        require(!proposalVoters[_proposalId][msg.sender], "You are already registered for this proposal");
        require(block.timestamp < proposals[_proposalId].startTime, "Cannot register after voting starts");
        
        proposalVoters[_proposalId][msg.sender] = true;
        emit VoterRegisteredForProposal(_proposalId, msg.sender);
    }
    
    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _durationInDays
    ) external returns (uint256) {
        require(_durationInDays > 0, "Duration must be greater than 0");
        
        proposalCount++;
        uint256 startTime = block.timestamp + 5 minutes; // Голосование начинается через минуту
        uint256 endTime = startTime + (_durationInDays * 1 days);
        
        proposals[proposalCount] = Proposal({
            id: proposalCount,
            title: _title,
            description: _description,
            creator: msg.sender,
            startTime: startTime,
            endTime: endTime,
            finalized: false,
            totalVotes: 0,
            candidateIds: new uint256[](0)
        });
        
        emit ProposalCreated(proposalCount, _title, startTime, endTime);
        return proposalCount;
    }
    
    function addCandidate(
        uint256 _proposalId,
        string memory _name,
        string memory _description
    ) external proposalExists(_proposalId) returns (uint256) {
        require(block.timestamp < proposals[_proposalId].startTime, "Cannot add candidates after voting starts");
        
        candidateCount++;
        
        proposalCandidates[_proposalId][candidateCount] = Candidate({
            id: candidateCount,
            name: _name,
            description: _description,
            voteCount: 0,
            exists: true
        });
        
        proposals[_proposalId].candidateIds.push(candidateCount);
        
        emit CandidateAdded(_proposalId, candidateCount, _name);
        return candidateCount;
    }
    
    function vote(uint256 _proposalId, uint256 _candidateId) 
        external 
        proposalExists(_proposalId) 
        proposalActive(_proposalId) 
        canVoteInProposal(_proposalId)
    {
        require(!hasVoted[_proposalId][msg.sender], "You have already voted");
        require(proposalCandidates[_proposalId][_candidateId].exists, "Candidate does not exist");
        
        hasVoted[_proposalId][msg.sender] = true;
        voterChoice[_proposalId][msg.sender] = _candidateId;
        proposalCandidates[_proposalId][_candidateId].voteCount++;
        proposals[_proposalId].totalVotes++;
        
        emit VoteCast(_proposalId, msg.sender, _candidateId);
    }
    
    function finalizeProposal(uint256 _proposalId) 
        external 
        onlyOwner 
        proposalExists(_proposalId) 
    {
        require(block.timestamp > proposals[_proposalId].endTime, "Voting period not ended");
        require(!proposals[_proposalId].finalized, "Proposal already finalized");
        
        proposals[_proposalId].finalized = true;
        
        uint256 winningCandidateId = getWinner(_proposalId);
        emit ProposalFinalized(_proposalId, winningCandidateId);
    }
    
    function getWinner(uint256 _proposalId) 
        public 
        view 
        proposalExists(_proposalId) 
        returns (uint256) 
    {
        uint256[] memory candidateIds = proposals[_proposalId].candidateIds;
        require(candidateIds.length > 0, "No candidates in this proposal");
        
        uint256 winningVoteCount = 0;
        uint256 winningCandidateId = 0;
        
        for (uint256 i = 0; i < candidateIds.length; i++) {
            uint256 candidateId = candidateIds[i];
            if (proposalCandidates[_proposalId][candidateId].voteCount > winningVoteCount) {
                winningVoteCount = proposalCandidates[_proposalId][candidateId].voteCount;
                winningCandidateId = candidateId;
            }
        }
        
        return winningCandidateId;
    }
    
    function getCandidate(uint256 _proposalId, uint256 _candidateId) 
        external 
        view 
        returns (
            uint256 id,
            string memory name,
            string memory description,
            uint256 voteCount
        ) 
    {
        Candidate memory candidate = proposalCandidates[_proposalId][_candidateId];
        require(candidate.exists, "Candidate does not exist");
        return (candidate.id, candidate.name, candidate.description, candidate.voteCount);
    }
    
    function getProposalCandidates(uint256 _proposalId) 
        external 
        view 
        proposalExists(_proposalId) 
        returns (uint256[] memory) 
    {
        return proposals[_proposalId].candidateIds;
    }
    
    function getResults(uint256 _proposalId) 
        external 
        view 
        proposalExists(_proposalId) 
        returns (
            uint256[] memory candidateIds,
            uint256[] memory voteCounts,
            uint256 totalVotes
        ) 
    {
        uint256[] memory ids = proposals[_proposalId].candidateIds;
        uint256[] memory counts = new uint256[](ids.length);
        
        for (uint256 i = 0; i < ids.length; i++) {
            counts[i] = proposalCandidates[_proposalId][ids[i]].voteCount;
        }
        
        return (ids, counts, proposals[_proposalId].totalVotes);
    }
    
    function hasVotedInProposal(uint256 _proposalId, address _voter) 
        external 
        view 
        returns (bool) 
    {
        return hasVoted[_proposalId][_voter];
    }
    
    function isVoterRegisteredForProposal(uint256 _proposalId, address _voter) 
        external 
        view 
        proposalExists(_proposalId) 
        returns (bool) 
    {
        return proposalVoters[_proposalId][_voter];
    }
    
    function isVoterGloballyRegistered(address _voter) 
        external 
        view 
        returns (bool) 
    {
        return registeredVoters[_voter];
    }
    
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
    
    // Function to get current block timestamp for frontend
    function getCurrentTimestamp() external view returns (uint256) {
        return block.timestamp;
    }
}
