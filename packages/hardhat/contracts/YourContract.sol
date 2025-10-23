//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

contract Voting {
    struct Proposal {
        string name;
        string description;
        uint256 voteCount;
        address proposer;
    }

    struct VotingSession {
        string title;
        string description;
        Proposal[] proposals;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) voterWeights; // For weighted voting
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        address creator;
        uint256 totalVotes;
        bool requiresApproval; // For proposal approval system
        mapping(uint256 => bool) approvedProposals;
    }

    mapping(uint256 => VotingSession) public votingSessions;
    uint256 public sessionCount;
    
    // Admin functions
    address public admin;
    mapping(address => bool) public moderators;
    
    // Events
    event VotingSessionCreated(uint256 sessionId, string title, address creator);
    event VoteCast(uint256 sessionId, uint256 proposalId, address voter, uint256 weight);
    event VotingSessionEnded(uint256 sessionId);
    event ProposalAdded(uint256 sessionId, uint256 proposalId, string name, address proposer);
    event ModeratorAdded(address moderator);
    event ModeratorRemoved(address moderator);

    modifier onlyActive(uint256 _sessionId) {
        require(votingSessions[_sessionId].isActive, "Voting session is not active");
        require(block.timestamp >= votingSessions[_sessionId].startTime, "Voting not started");
        require(block.timestamp <= votingSessions[_sessionId].endTime, "Voting ended");
        _;
    }

    modifier onlyCreator(uint256 _sessionId) {
        require(msg.sender == votingSessions[_sessionId].creator, "Only creator can perform this action");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyModerator() {
        require(moderators[msg.sender] || msg.sender == admin, "Only moderators can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
        moderators[msg.sender] = true;
    }

    function createVotingSession(
        string memory _title,
        string memory _description,
        string[] memory _proposalNames,
        string[] memory _proposalDescriptions,
        uint256 _durationInMinutes,
        bool _requiresApproval
    ) public returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(_proposalNames.length > 0, "At least one proposal required");
        require(_proposalNames.length == _proposalDescriptions.length, "Proposal names and descriptions must match");
        require(_durationInMinutes > 0, "Duration must be positive");

        uint256 sessionId = sessionCount++;
        VotingSession storage newSession = votingSessions[sessionId];
        
        newSession.title = _title;
        newSession.description = _description;
        newSession.startTime = block.timestamp;
        newSession.endTime = block.timestamp + (_durationInMinutes * 1 minutes);
        newSession.isActive = true;
        newSession.creator = msg.sender;
        newSession.requiresApproval = _requiresApproval;

        for (uint256 i = 0; i < _proposalNames.length; i++) {
            newSession.proposals.push(Proposal({
                name: _proposalNames[i],
                description: _proposalDescriptions[i],
                voteCount: 0,
                proposer: msg.sender
            }));
            
            if (!_requiresApproval) {
                newSession.approvedProposals[i] = true;
            }
        }

        emit VotingSessionCreated(sessionId, _title, msg.sender);
        return sessionId;
    }

    function addProposal(
        uint256 _sessionId,
        string memory _name,
        string memory _description
    ) public onlyActive(_sessionId) {
        VotingSession storage session = votingSessions[_sessionId];
        require(session.requiresApproval, "This session doesn't allow new proposals");
        
        uint256 proposalId = session.proposals.length;
        session.proposals.push(Proposal({
            name: _name,
            description: _description,
            voteCount: 0,
            proposer: msg.sender
        }));
        
        emit ProposalAdded(_sessionId, proposalId, _name, msg.sender);
    }

    function approveProposal(uint256 _sessionId, uint256 _proposalId) public onlyModerator {
        VotingSession storage session = votingSessions[_sessionId];
        require(_proposalId < session.proposals.length, "Invalid proposal ID");
        require(session.requiresApproval, "This session doesn't require approval");
        
        session.approvedProposals[_proposalId] = true;
    }

    function vote(uint256 _sessionId, uint256 _proposalId) public onlyActive(_sessionId) {
        VotingSession storage session = votingSessions[_sessionId];
        require(!session.hasVoted[msg.sender], "You have already voted");
        require(_proposalId < session.proposals.length, "Invalid proposal ID");
        require(session.approvedProposals[_proposalId], "Proposal not approved");

        session.hasVoted[msg.sender] = true;
        session.proposals[_proposalId].voteCount++;
        session.totalVotes++;

        emit VoteCast(_sessionId, _proposalId, msg.sender, 1);
    }

    function weightedVote(uint256 _sessionId, uint256 _proposalId, uint256 _weight) public onlyActive(_sessionId) {
        VotingSession storage session = votingSessions[_sessionId];
        require(!session.hasVoted[msg.sender], "You have already voted");
        require(_proposalId < session.proposals.length, "Invalid proposal ID");
        require(session.approvedProposals[_proposalId], "Proposal not approved");
        require(_weight > 0, "Weight must be positive");

        session.hasVoted[msg.sender] = true;
        session.voterWeights[msg.sender] = _weight;
        session.proposals[_proposalId].voteCount += _weight;
        session.totalVotes += _weight;

        emit VoteCast(_sessionId, _proposalId, msg.sender, _weight);
    }

    function getProposals(uint256 _sessionId) public view returns (Proposal[] memory) {
        return votingSessions[_sessionId].proposals;
    }

    function getSessionInfo(uint256 _sessionId) public view returns (
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        address creator,
        uint256 totalVotes,
        bool requiresApproval
    ) {
        VotingSession storage session = votingSessions[_sessionId];
        return (
            session.title,
            session.description,
            session.startTime,
            session.endTime,
            session.isActive,
            session.creator,
            session.totalVotes,
            session.requiresApproval
        );
    }

    function hasVoted(uint256 _sessionId, address _voter) public view returns (bool) {
        return votingSessions[_sessionId].hasVoted[_voter];
    }

    function getVoterWeight(uint256 _sessionId, address _voter) public view returns (uint256) {
        return votingSessions[_sessionId].voterWeights[_voter];
    }

    function isProposalApproved(uint256 _sessionId, uint256 _proposalId) public view returns (bool) {
        return votingSessions[_sessionId].approvedProposals[_proposalId];
    }

    function endVotingSession(uint256 _sessionId) public onlyCreator(_sessionId) {
        votingSessions[_sessionId].isActive = false;
        emit VotingSessionEnded(_sessionId);
    }

    function getWinningProposal(uint256 _sessionId) public view returns (uint256 winningProposalId, uint256 winningVoteCount) {
        VotingSession storage session = votingSessions[_sessionId];
        winningVoteCount = 0;
        winningProposalId = 0;

        for (uint256 i = 0; i < session.proposals.length; i++) {
            if (session.proposals[i].voteCount > winningVoteCount) {
                winningVoteCount = session.proposals[i].voteCount;
                winningProposalId = i;
            }
        }
    }

    function getAllSessions() public view returns (uint256[] memory) {
        uint256[] memory sessions = new uint256[](sessionCount);
        for (uint256 i = 0; i < sessionCount; i++) {
            sessions[i] = i;
        }
        return sessions;
    }

    // Admin functions
    function addModerator(address _moderator) public onlyAdmin {
        moderators[_moderator] = true;
        emit ModeratorAdded(_moderator);
    }

    function removeModerator(address _moderator) public onlyAdmin {
        moderators[_moderator] = false;
        emit ModeratorRemoved(_moderator);
    }

    function changeAdmin(address _newAdmin) public onlyAdmin {
        admin = _newAdmin;
    }
}