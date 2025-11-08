# Safient AI - Secure Transfer System

Safient AI is an advanced secure transfer system built on the Algorand blockchain that provides time-locked protection for cryptocurrency transfers. It allows users to send funds with a built-in reclaim mechanism during a specified protection period.

## 🌟 Features

### Core Functionality
- **Protected Transfers**: Send ALGO with built-in protection mechanisms
- **Time-Locked Security**: Set protection periods from 5 minutes to 24 hours
- **Reclaim Capability**: Sender can reclaim funds during the protection period
- **Automatic Release**: Funds automatically release to recipient after expiration
- **Decentralized**: No intermediaries - everything handled by smart contracts

### User Interface
- **Intuitive Design**: Clean, modern interface built with React and Tailwind CSS
- **Real-time Updates**: Live countdown timers and status updates
- **Transaction History**: Track all your Safient AI transfers
- **Mobile Responsive**: Works seamlessly on all devices

### Security
- **Smart Contract Based**: All logic handled by audited PyTeal smart contracts
- **Non-custodial**: Users maintain full control of their funds
- **Transparent**: All transactions visible on the Algorand blockchain

## 🏗️ Architecture

### Smart Contract (`safient_ai_contract.py`)
PyTeal-based smart contract that handles:
- Transfer creation and fund locking
- Time-based access control
- Reclaim functionality for senders
- Automatic release to recipients
- Status tracking and validation

### API Routes
- **`/api/create-transfer`**: Create new Safient AI transfers
- **`/api/reclaim-funds`**: Reclaim funds during protection period
- **`/api/release-funds`**: Release funds to recipient after expiration
- **`/api/transfer-status`**: Check transfer status and details

### Components
- **`SafientAIEscrow`**: Main transfer creation interface
- **`CountdownTimer`**: Real-time countdown display
- **`TransferStatus`**: Detailed transfer information and actions

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.8+ with pip
- Algorand testnet account with ALGO for testing

### 1. Install Dependencies

#### JavaScript/TypeScript Dependencies
```bash
# Already included in main project package.json
npm install
```

#### Python Dependencies
```bash
pip install py-algorand-sdk pyteal
```

### 2. Environment Setup

Create or update `.env.local` in the project root:
```env
# Safient AI Configuration
# Uses 749279083 by default if not set
SAFIENT_AI_APP_ID=749279083
ALGORAND_NETWORK=testnet
```

### 3. Smart Contract Deployment

#### Compile the Contract
```bash
cd src/app/Algorand/Algo-smart/contracts
python compile_contract.py
```

#### Deploy to Testnet
```bash
python deploy_contract.py testnet
```

Follow the prompts to enter your deployer mnemonic. The script will:
- Compile the contract
- Deploy to Algorand testnet
- Save deployment information
- Provide the App ID for configuration

### 4. Update Configuration

After deployment, update your `.env.local` with the App ID:
```env
SAFIENT_AI_APP_ID=749279083
```

### 5. Start Development Server
```bash
npm run dev
```

Navigate to `http://localhost:3000/Algorand/Algo-smart/pages/safient-ai` to access Safient AI.

## 📱 Usage Guide

### Creating a Transfer
1. **Connect Wallet**: Ensure your Algorand wallet is connected
2. **Enter Details**: 
   - Recipient's Algorand address
   - Amount in ALGO
   - Protection period (5 minutes to 24 hours)
3. **Create Transfer**: Confirm transaction in your wallet
4. **Monitor Status**: Track your transfer with real-time updates

### Managing Transfers
- **View Active Transfers**: See all your ongoing transfers
- **Reclaim Funds**: Reclaim your funds during the protection period
- **Release Funds**: Release funds to recipient after expiration (anyone can trigger)
- **Transaction History**: View complete transfer history

## 🔧 Technical Details

### Smart Contract States
- **ACTIVE (1)**: Transfer is active, funds can be reclaimed
- **COMPLETED (2)**: Funds released to recipient
- **RECLAIMED (3)**: Funds reclaimed by sender

### Global State Schema
- `safient_sender`: Original sender address (32 bytes)
- `safient_receiver`: Recipient address (32 bytes)
- `safient_amount`: Transfer amount in microAlgos (uint64)
- `safient_window`: Protection window in seconds (uint64)
- `safient_initiated`: Transfer creation timestamp (uint64)
- `safient_unlocks`: When protection period ends (uint64)
- `safient_state`: Current transfer status (uint64)
- `safient_version`: Contract version tag (bytes)

### API Response Formats

#### Create Transfer Response
```typescript
interface CreateSafientAIResponse {
  success: boolean;
  transferId?: string;
  transactionId?: string;
  appId?: number;
  senderAddress?: string;
  recipientAddress?: string;
  amount?: number;
  lockDurationMinutes?: number;
  expirationTime?: number;
  status?: string;
  blockRound?: number;
  createdAt?: number;
  error?: string;
}
```

## 🛡️ Security Considerations

### Smart Contract Security
- **Time Validation**: Strict validation of lock duration (5 minutes to 24 hours)
- **Address Validation**: Proper Algorand address format checking
- **Access Control**: Only sender can reclaim, anyone can release after expiration
- **State Management**: Atomic state updates prevent race conditions

### Frontend Security
- **Input Validation**: Client-side validation with server-side verification
- **Mnemonic Handling**: Mnemonics never stored, only used for transaction signing
- **Error Handling**: Comprehensive error handling and user feedback

## 🧪 Testing

### Unit Tests
```bash
# Run smart contract tests
cd contracts
python -m pytest test_safient_ai_contract.py

# Run frontend tests
npm test
```

### Integration Testing
1. Deploy contract to testnet
2. Create test transfers with various parameters
3. Test reclaim functionality
4. Test automatic release
5. Verify state transitions

## 📊 Monitoring and Analytics

### Transaction Tracking
- All transfers tracked on Algorand blockchain
- AlgoExplorer integration for transaction details
- Real-time status updates

### Performance Metrics
- Transfer creation success rate
- Average confirmation times
- Gas usage optimization

## 🔄 Future Enhancements

### Planned Features
- **Multi-token Support**: Support for Algorand Standard Assets (ASAs)
- **Batch Transfers**: Create multiple transfers in one transaction
- **Recurring Transfers**: Set up automatic recurring protected transfers
- **Mobile App**: Native mobile application
- **Advanced Analytics**: Detailed transfer analytics and reporting

### Smart Contract Upgrades
- **Partial Releases**: Allow partial fund releases
- **Multi-signature**: Support for multi-signature wallets
- **Custom Logic**: Programmable release conditions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Write comprehensive tests
- Document new features
- Follow security best practices

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review existing issues and discussions

## 🙏 Acknowledgments

- Algorand Foundation for the robust blockchain platform
- PyTeal team for the smart contract development framework
- Next.js and React teams for the excellent frontend framework
- Tailwind CSS for the utility-first CSS framework