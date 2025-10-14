const ReliabilityService = require('../../services/reliabilityService');
const User = require('../../models/User');

describe('ReliabilityService', () => {
  let testUser;

  beforeEach(async () => {
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123'
    });
    await testUser.save();
  });

  describe('calculateScore', () => {
    test('should calculate score for timely contributions', () => {
      const contributionHistory = [
        { contributed: true, contributedAt: new Date('2024-01-01') }
      ];
      const expectedDate = new Date('2024-01-01');

      const score = ReliabilityService.calculateScore(contributionHistory, expectedDate);
      expect(score).toBe(100); // Base score for on-time contribution
    });

    test('should calculate score for early contributions', () => {
      const contributionHistory = [
        { contributed: true, contributedAt: new Date('2023-12-31') }
      ];
      const expectedDate = new Date('2024-01-01');

      const score = ReliabilityService.calculateScore(contributionHistory, expectedDate);
      expect(score).toBe(105); // Base score + early bonus
    });

    test('should calculate score for late contributions', () => {
      const contributionHistory = [
        { contributed: true, contributedAt: new Date('2024-01-03') }
      ];
      const expectedDate = new Date('2024-01-01');

      const score = ReliabilityService.calculateScore(contributionHistory, expectedDate);
      expect(score).toBe(80); // Base score - late penalty (2 days * 10 points)
    });

    test('should calculate score for missed contributions', () => {
      const contributionHistory = [
        { contributed: false }
      ];
      const expectedDate = new Date('2024-01-01');

      const score = ReliabilityService.calculateScore(contributionHistory, expectedDate);
      expect(score).toBe(50); // Base score - missed contribution penalty
    });
  });

  describe('updateUserScore', () => {
    test('should update user reliability score', async () => {
      const newScore = 150;
      const updatedUser = await ReliabilityService.updateUserScore(testUser._id, newScore);
      
      expect(updatedUser.reliabilityScore).toBe(newScore);
    });

    test('should throw error for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await expect(ReliabilityService.updateUserScore(nonExistentId, 100))
        .rejects.toThrow('User not found');
    });
  });

  describe('getUserScore', () => {
    test('should get user reliability score', async () => {
      testUser.reliabilityScore = 120;
      await testUser.save();

      const userScore = await ReliabilityService.getUserScore(testUser._id);
      expect(userScore.reliabilityScore).toBe(120);
    });

    test('should throw error for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      await expect(ReliabilityService.getUserScore(nonExistentId))
        .rejects.toThrow('User not found');
    });
  });

  describe('awardTimelyContribution', () => {
    test('should award points for timely contribution', async () => {
      const initialScore = testUser.reliabilityScore;
      const points = 15;
      
      const updatedUser = await ReliabilityService.awardTimelyContribution(testUser._id, points);
      expect(updatedUser.reliabilityScore).toBe(initialScore + points);
    });
  });

  describe('deductLateContribution', () => {
    test('should deduct points for late contribution', async () => {
      testUser.reliabilityScore = 100;
      await testUser.save();
      
      const points = 20;
      const updatedUser = await ReliabilityService.deductLateContribution(testUser._id, points);
      expect(updatedUser.reliabilityScore).toBe(80);
    });

    test('should not allow negative scores', async () => {
      testUser.reliabilityScore = 10;
      await testUser.save();
      
      const points = 20;
      const updatedUser = await ReliabilityService.deductLateContribution(testUser._id, points);
      expect(updatedUser.reliabilityScore).toBe(0);
    });
  });
});
