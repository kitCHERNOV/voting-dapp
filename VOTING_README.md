# Decentralized Voting DApp

A comprehensive decentralized voting system built with Scaffold-ETH 2, featuring multiple voting sessions, proposal management, and admin controls.

## Features

### Smart Contract Features
- **Multiple Voting Sessions**: Create and manage multiple voting sessions simultaneously
- **Proposal Management**: Add proposals with names and descriptions
- **Approval System**: Optional proposal approval requirement for moderated voting
- **Weighted Voting**: Support for weighted voting (future enhancement)
- **Admin Controls**: Admin and moderator roles for system management
- **Time-based Voting**: Set start and end times for voting sessions
- **Vote Tracking**: Prevent double voting and track voter participation

### Frontend Features
- **Session Management**: View and switch between different voting sessions
- **Real-time Updates**: Live vote counts and session status
- **Create Sessions**: User-friendly form to create new voting sessions
- **Proposal Display**: Clear presentation of proposals with vote counts
- **Voting Interface**: Simple one-click voting system
- **Results Display**: Automatic winner calculation and display
- **Responsive Design**: Works on desktop and mobile devices

## Smart Contract Functions

### Core Functions
- `createVotingSession()` - Create a new voting session
- `vote()` - Cast a vote for a proposal
- `weightedVote()` - Cast a weighted vote
- `addProposal()` - Add new proposals to existing sessions
- `approveProposal()` - Approve proposals (moderator only)

### View Functions
- `getSessionInfo()` - Get session details
- `getProposals()` - Get all proposals for a session
- `hasVoted()` - Check if an address has voted
- `getWinningProposal()` - Get the winning proposal
- `getAllSessions()` - Get all session IDs

### Admin Functions
- `addModerator()` - Add a moderator (admin only)
- `removeModerator()` - Remove a moderator (admin only)
- `changeAdmin()` - Transfer admin role (admin only)

## Deployment Instructions

### Prerequisites
- Node.js >= 20.18.3
- Yarn package manager
- Git

### Local Development Setup

1. **Clone and Install Dependencies**
   ```bash
   git clone <your-repo-url>
   cd voting-dapp
   yarn install
   ```

2. **Start Local Blockchain**
   ```bash
   yarn chain
   ```
   This starts a local Hardhat network on http://localhost:8545

3. **Deploy Contracts**
   ```bash
   yarn deploy
   ```
   This deploys the Voting contract and creates test voting sessions

4. **Start Frontend**
   ```bash
   yarn start
   ```
   This starts the Next.js frontend on http://localhost:3000

### Using the Application

1. **Connect Wallet**: Click "Connect Wallet" and connect your MetaMask or other wallet
2. **View Sessions**: Browse available voting sessions on the main voting page
3. **Vote**: Click on a session to view proposals and cast your vote
4. **Create Sessions**: Use the "Create New Session" button to create custom voting sessions
5. **View Results**: See real-time vote counts and final results

### Test Voting Sessions

The deployment script creates two test sessions:

1. **Best Project Selection** (60 minutes, no approval required)
   - Project A: A revolutionary blockchain project
   - Project B: An innovative DeFi solution  
   - Project C: A creative NFT platform

2. **Community Proposal Voting** (120 minutes, requires approval)
   - Proposal 1: Increase community rewards
   - Proposal 2: Change governance parameters

## Contract Architecture

### Data Structures

```solidity
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
    mapping(address => uint256) voterWeights;
    uint256 startTime;
    uint256 endTime;
    bool isActive;
    address creator;
    uint256 totalVotes;
    bool requiresApproval;
    mapping(uint256 => bool) approvedProposals;
}
```

### Security Features

- **Access Control**: Admin and moderator roles
- **Time Validation**: Voting only allowed within session timeframes
- **Double Vote Prevention**: Each address can only vote once per session
- **Proposal Validation**: Proposals must be approved in moderated sessions
- **Input Validation**: Comprehensive checks for all user inputs

## Frontend Architecture

### Key Components

- **VotingPage**: Main voting interface
- **CreateSessionModal**: Form for creating new voting sessions
- **SessionCard**: Individual session display
- **ProposalCard**: Individual proposal display with voting buttons

### Hooks Used

- `useScaffoldReadContract`: Read contract data
- `useScaffoldWriteContract`: Write contract transactions
- `useAccount`: Get connected wallet address

## Development Commands

```bash
# Compile contracts
yarn compile

# Run tests
yarn test

# Deploy to local network
yarn deploy

# Start local blockchain
yarn chain

# Start frontend
yarn start

# Format code
yarn format

# Lint code
yarn lint
```

## Network Configuration

The application is configured to work with:
- **Local Development**: Hardhat local network
- **Testnets**: Sepolia, Goerli (configurable in scaffold.config.ts)
- **Mainnet**: Ethereum mainnet (for production)

## Security Considerations

1. **Access Control**: Only authorized users can perform admin functions
2. **Input Validation**: All inputs are validated on-chain
3. **Time Locks**: Voting sessions have defined time windows
4. **Vote Integrity**: Prevents double voting and ensures vote accuracy
5. **Moderation**: Optional approval system for proposal quality control

## Future Enhancements

- **Token-based Voting**: Weight votes by token holdings
- **Delegation**: Allow vote delegation to trusted addresses
- **Quadratic Voting**: Implement quadratic voting mechanisms
- **Multi-signature**: Require multiple signatures for important decisions
- **IPFS Integration**: Store proposal details on IPFS for decentralization
- **Mobile App**: Native mobile application
- **Analytics Dashboard**: Detailed voting analytics and insights

## Troubleshooting

### Common Issues

1. **Contract Not Deployed**: Run `yarn deploy` after starting the local blockchain
2. **Frontend Not Loading**: Ensure both blockchain and frontend are running
3. **Transaction Fails**: Check if you have enough ETH for gas fees
4. **Wallet Not Connecting**: Ensure MetaMask is installed and unlocked

### Getting Help

- Check the console for error messages
- Verify your wallet is connected to the correct network
- Ensure you have sufficient ETH for transaction fees
- Check that voting sessions are active and within time limits

## License

MIT License - see LICENSE file for details.
