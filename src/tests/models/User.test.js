const mongoose = require('mongoose');
const User = require('../../models/User');

describe('User Model', () => {
  test('should create a user with valid data', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedpassword123',
      role: 'particulier'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser._id).toBeDefined();
    expect(savedUser.name).toBe(userData.name);
    expect(savedUser.email).toBe(userData.email);
    expect(savedUser.role).toBe(userData.role);
    expect(savedUser.kycStatus).toBe('Pending');
    expect(savedUser.reliabilityScore).toBe(0);
  });

  test('should require name field', async () => {
    const userData = {
      email: 'john@example.com',
      password: 'hashedpassword123'
    };

    const user = new User(userData);
    await expect(user.save()).rejects.toThrow();
  });

  test('should require email field', async () => {
    const userData = {
      name: 'John Doe',
      password: 'hashedpassword123'
    };

    const user = new User(userData);
    await expect(user.save()).rejects.toThrow();
  });

  test('should require password field', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    const user = new User(userData);
    await expect(user.save()).rejects.toThrow();
  });

  test('should enforce unique email', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedpassword123'
    };

    const user1 = new User(userData);
    await user1.save();

    const user2 = new User(userData);
    await expect(user2.save()).rejects.toThrow();
  });

  test('should set default values correctly', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedpassword123'
    };

    const user = new User(userData);
    const savedUser = await user.save();

    expect(savedUser.role).toBe('particulier');
    expect(savedUser.kycStatus).toBe('Pending');
    expect(savedUser.reliabilityScore).toBe(0);
  });

  test('should validate kycStatus enum values', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedpassword123',
      kycStatus: 'InvalidStatus'
    };

    const user = new User(userData);
    await expect(user.save()).rejects.toThrow();
  });
});
