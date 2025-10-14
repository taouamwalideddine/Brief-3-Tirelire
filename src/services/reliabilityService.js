const User = require('../models/User');

class ReliabilityService {
  // Calculate reliability score based on contribution timeliness
  static calculateScore(contributionHistory, expectedContributionDate) {
    let score = 0;
    const baseScore = 100;
    const latePenalty = 10; // Points deducted per day late
    const earlyBonus = 5; // Points added for early contribution
    
    for (const contribution of contributionHistory) {
      if (contribution.contributed) {
        const contributionDate = new Date(contribution.contributedAt);
        const daysDifference = Math.floor((contributionDate - expectedContributionDate) / (1000 * 60 * 60 * 24));
        
        if (daysDifference < 0) {
          // Early contribution
          score += earlyBonus;
        } else if (daysDifference === 0) {
          // On time
          score += 0;
        } else {
          // Late contribution
          score -= latePenalty * daysDifference;
        }
      } else {
        // Missed contribution
        score -= 50;
      }
    }
    
    return Math.max(0, baseScore + score);
  }

  // Update user reliability score
  static async updateUserScore(userId, newScore) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      user.reliabilityScore = newScore;
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Failed to update reliability score: ${error.message}`);
    }
  }

  // Get reliability score for a user
  static async getUserScore(userId) {
    try {
      const user = await User.findById(userId).select('reliabilityScore name email');
      if (!user) throw new Error('User not found');
      return user;
    } catch (error) {
      throw new Error(`Failed to get reliability score: ${error.message}`);
    }
  }

  // Get users sorted by reliability score
  static async getUsersByReliability(limit = 10) {
    try {
      return await User.find()
        .select('name email reliabilityScore')
        .sort({ reliabilityScore: -1 })
        .limit(limit);
    } catch (error) {
      throw new Error(`Failed to get users by reliability: ${error.message}`);
    }
  }

  // Award points for timely contribution
  static async awardTimelyContribution(userId, points = 10) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      user.reliabilityScore += points;
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Failed to award points: ${error.message}`);
    }
  }

  // Deduct points for late contribution
  static async deductLateContribution(userId, points = 5) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      user.reliabilityScore = Math.max(0, user.reliabilityScore - points);
      await user.save();
      return user;
    } catch (error) {
      throw new Error(`Failed to deduct points: ${error.message}`);
    }
  }
}

module.exports = ReliabilityService;
