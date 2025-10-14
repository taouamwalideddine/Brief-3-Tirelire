# Tirelire API - Digital Tontine (Daret) Management System

A secure backend API for managing digital tontine groups where users contribute fixed amounts monthly and rotate receiving the shared pot.

## Features

### Core Features
- **User Registration & Authentication**: JWT-based auth with roles (Particulier, Admin)
- **Group Management**: Create, join, and manage tontine groups
- **Contribution Rounds**: Track monthly contributions and turn assignments
- **KYC Verification**: Identity verification with document upload
- **Reliability Scoring**: Internal scoring system for consistent members
- **Audit Logging**: Complete traceability of all actions
- **Error Handling**: Comprehensive error management

### Technical Features
- **OOP & N-tier Architecture**: Express.js with MongoDB/Mongoose
- **Docker Support**: Containerized deployment
- **Testing**: Jest with >80% coverage
- **Security**: JWT authentication, KYC enforcement
- **File Upload**: Secure image handling for KYC documents

## Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB
- Docker (optional)

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd brief-3
npm install
```

2. **Environment setup:**
```bash
cp env.example .env
# Edit .env with your configuration
```

3. **Start the application:**
```bash
# Development
npm run dev

# Production
npm start
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in background
docker-compose up -d
```

## API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
- `GET /api/users/protected` - Protected route test

### KYC Management
- `POST /api/kyc/submit` - Submit KYC documents
- `POST /api/kyc/verify/:userId` - Verify KYC (Admin only)

### Group Management
- `POST /api/groups/create` - Create new group
- `POST /api/groups/join/:groupId` - Join existing group
- `GET /api/groups` - List user's groups
- `GET /api/groups/:groupId` - Get group details
- `GET /api/groups/:groupId/stats` - Get group statistics

### Contributions & Turns
- `POST /api/groups/:groupId/mark-paid` - Mark contribution as paid
- `GET /api/groups/:groupId/current-turn` - Get current turn info
- `POST /api/groups/:groupId/receive-turn` - Mark turn as received
- `POST /api/groups/:groupId/advance-turn` - Advance to next turn (Admin)

### Reliability & Scoring
- `GET /api/groups/:groupId/reliability/:userId` - Get user reliability score
- `GET /api/groups/:groupId/top-reliable` - Get top reliable users

### Audit & Logging
- `GET /api/audit/my-logs` - Get user's audit logs
- `GET /api/audit/group/:groupId` - Get group audit logs
- `GET /api/audit/all` - Get all logs (Admin only)
- `GET /api/audit/stats` - Get audit statistics (Admin only)

## Data Models

### User
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required),
  role: String (default: 'particulier'),
  nationalID: String,
  kycStatus: String (enum: ['Pending', 'Verified', 'Rejected']),
  nationalIDImagePath: String,
  reliabilityScore: Number (default: 0)
}
```

### Group
```javascript
{
  name: String (required),
  members: [ObjectId],
  admin: ObjectId (required),
  turns: [TurnSchema],
  contributions: [ContributionSchema],
  currentRound: Number (default: 1),
  currentTurnIndex: Number (default: 0),
  contributionAmount: Number (default: 100),
  isActive: Boolean (default: true),
  completedRounds: [Number]
}
```

## Security Features

### KYC Enforcement
- All group operations require KYC verification
- Document upload with validation
- Admin verification workflow

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Middleware for route protection

### Audit Trail
- Complete action logging
- IP address and user agent tracking
- Dispute resolution support

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Development

### Project Structure
```
src/
├── config/          # Database configuration
├── controllers/     # Route controllers
├── middlewares/     # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic services
├── tests/           # Test files
└── utils/           # Utility functions
```

### Code Standards
- ESLint configuration
- Jest testing framework
- Error handling middleware
- Consistent naming conventions

## Deployment

### Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/tirelire
JWT_SECRET=your-super-secret-jwt-key
PORT=5000
NODE_ENV=production
```

### Docker Configuration
- Multi-stage Dockerfile
- Docker Compose for local development
- Volume mounting for file uploads

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## License

ISC License

## Support

For support and questions, please contact the development team.
