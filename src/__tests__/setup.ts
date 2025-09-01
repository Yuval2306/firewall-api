import database from '../config/database';

beforeAll(async () => {
  // Connect to database before tests
  await database.connect();
});

afterAll(async () => {
  // Disconnect after tests
  await database.disconnect();
});