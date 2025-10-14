# Tirelire API

Digital tontine (Daret) management system with secure backend API.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/tirelire
JWT_SECRET=your-secret-key-here
PORT=5000
```

3. Start MongoDB and run the API:
```bash
npm start
```

## Docker Setup

```bash
docker-compose up
```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/protected` - Test protected route

### KYC
- `POST /api/kyc/submit` - Submit KYC documents
- `POST /api/kyc/verify/:userId` - Admin verify KYC (Admin only)

### Groups
- `POST /api/groups/create` - Create group (KYC required)
- `POST /api/groups/join/:groupId` - Join group (KYC required)
- `GET /api/groups` - List user groups
- `GET /api/groups/:groupId` - Get group details
- `POST /api/groups/:groupId/mark-paid` - Mark contribution as paid (KYC required)
- `POST /api/groups/:groupId/set-contribution-amount` - Set contribution amount (Admin only)
- `POST /api/groups/:groupId/advance-turn` - Advance to next turn (Admin only)
- `POST /api/groups/:groupId/mark-received` - Mark current turn as received (Admin only)
- `GET /api/groups/:groupId/logs` - Get group activity logs

## Postman Testing

1. Register a user: `POST /api/users/register`
2. Login: `POST /api/users/login` (save the token)
3. Add `Authorization: Bearer <token>` header to protected routes
4. Submit KYC: `POST /api/kyc/submit` (form-data with nationalID and nationalIDImage)
5. Admin verify KYC: `POST /api/kyc/verify/:userId`
6. Create group: `POST /api/groups/create`
7. Test other group operations
