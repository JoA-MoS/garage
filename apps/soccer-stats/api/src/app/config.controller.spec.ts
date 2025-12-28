import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';

import { ConfigController } from './config.controller';

describe('ConfigController', () => {
  let controller: ConfigController;
  const originalEnv = process.env;

  beforeEach(async () => {
    // Reset environment before each test
    process.env = { ...originalEnv };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
    }).compile();

    controller = module.get<ConfigController>(ConfigController);
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getPublicConfig', () => {
    it('should return the Clerk publishable key when set', () => {
      process.env['CLERK_PUBLISHABLE_KEY'] = 'pk_test_mock_key_12345';

      const result = controller.getPublicConfig();

      expect(result).toEqual({
        clerkPublishableKey: 'pk_test_mock_key_12345',
      });
    });

    it('should throw InternalServerErrorException when CLERK_PUBLISHABLE_KEY is not set', () => {
      delete process.env['CLERK_PUBLISHABLE_KEY'];

      expect(() => controller.getPublicConfig()).toThrow(
        InternalServerErrorException
      );
    });

    it('should throw InternalServerErrorException when CLERK_PUBLISHABLE_KEY is empty string', () => {
      process.env['CLERK_PUBLISHABLE_KEY'] = '';

      expect(() => controller.getPublicConfig()).toThrow(
        InternalServerErrorException
      );
    });
  });
});
