import database from '../../config/database';

// Mock logger to avoid winston issues in tests
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Database Connection', () => {
  it('should return database instance when connected', () => {
    expect(database.getDb()).toBeDefined();
  });
  
});