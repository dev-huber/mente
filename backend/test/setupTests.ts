export {};
/**
 * Test setup file - configures the testing environment
 */

// Extend Jest matchers
expect.extend({
  toBeValidAudioBuffer(received: Buffer) {
    const pass = Buffer.isBuffer(received) && received.length > 0;
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid audio buffer`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid audio buffer`,
        pass: false,
      };
    }
  },
});

// Declare the custom matchers for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidAudioBuffer(): R;
    }
  }
}

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.AZURE_STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=https;AccountName=testaccount;AccountKey=testkey;EndpointSuffix=core.windows.net';
process.env.STORAGE_CONTAINER_NAME = 'test-audio-files';
process.env.AZURE_AI_SUBSCRIPTION_KEY = 'test-subscription-key';
process.env.AZURE_AI_REGION = 'eastus';

// Increase timeout for async operations
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
