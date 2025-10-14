const mongoose = require('mongoose');
const Group = require('../../models/Group');
const User = require('../../models/User');

describe('Group Model', () => {
  let testUser;

  beforeEach(async () => {
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword123'
    });
    await testUser.save();
  });

  test('should create a group with valid data', async () => {
    const groupData = {
      name: 'Test Group',
      admin: testUser._id,
      members: [testUser._id],
      turns: [{ user: testUser._id, hasReceived: false, round: 1 }],
      contributionAmount: 100
    };

    const group = new Group(groupData);
    const savedGroup = await group.save();

    expect(savedGroup._id).toBeDefined();
    expect(savedGroup.name).toBe(groupData.name);
    expect(savedGroup.admin.toString()).toBe(testUser._id.toString());
    expect(savedGroup.members).toHaveLength(1);
    expect(savedGroup.currentRound).toBe(1);
    expect(savedGroup.currentTurnIndex).toBe(0);
    expect(savedGroup.isActive).toBe(true);
  });

  test('should require name field', async () => {
    const groupData = {
      admin: testUser._id,
      members: [testUser._id]
    };

    const group = new Group(groupData);
    await expect(group.save()).rejects.toThrow();
  });

  test('should require admin field', async () => {
    const groupData = {
      name: 'Test Group',
      members: [testUser._id]
    };

    const group = new Group(groupData);
    await expect(group.save()).rejects.toThrow();
  });

  test('should set default values correctly', async () => {
    const groupData = {
      name: 'Test Group',
      admin: testUser._id,
      members: [testUser._id]
    };

    const group = new Group(groupData);
    const savedGroup = await group.save();

    expect(savedGroup.currentRound).toBe(1);
    expect(savedGroup.currentTurnIndex).toBe(0);
    expect(savedGroup.contributionAmount).toBe(100);
    expect(savedGroup.isActive).toBe(true);
    expect(savedGroup.completedRounds).toEqual([]);
  });

  test('should get current turn user', async () => {
    const groupData = {
      name: 'Test Group',
      admin: testUser._id,
      members: [testUser._id],
      turns: [{ user: testUser._id, hasReceived: false, round: 1 }]
    };

    const group = new Group(groupData);
    await group.save();

    const currentTurn = group.getCurrentTurnUser();
    expect(currentTurn).toBeDefined();
    expect(currentTurn.user.toString()).toBe(testUser._id.toString());
  });

  test('should advance turn correctly', async () => {
    const user2 = new User({
      name: 'Test User 2',
      email: 'test2@example.com',
      password: 'hashedpassword123'
    });
    await user2.save();

    const groupData = {
      name: 'Test Group',
      admin: testUser._id,
      members: [testUser._id, user2._id],
      turns: [
        { user: testUser._id, hasReceived: false, round: 1 },
        { user: user2._id, hasReceived: false, round: 1 }
      ]
    };

    const group = new Group(groupData);
    await group.save();

    expect(group.currentTurnIndex).toBe(0);
    await group.advanceTurn();
    expect(group.currentTurnIndex).toBe(1);
  });

  test('should check if all contributions are collected', async () => {
    const groupData = {
      name: 'Test Group',
      admin: testUser._id,
      members: [testUser._id],
      contributions: [
        { user: testUser._id, round: 1, contributed: true }
      ]
    };

    const group = new Group(groupData);
    await group.save();

    expect(group.areAllContributionsCollected()).toBe(true);
  });
});
