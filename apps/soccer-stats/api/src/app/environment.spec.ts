import {
  getNodeEnv,
  isProduction,
  getPort,
  getFrontendUrl,
  getDbHost,
  getDbPort,
  getDbUsername,
  getDbPassword,
  getDbName,
  getDbSynchronize,
  getDbLogging,
  getDbPoolMax,
  getDbPoolMin,
  getDbPoolIdleTimeout,
  getDbPoolConnectionTimeout,
  getValidatedPoolConfig,
  getGraphqlIntrospection,
  getClerkSecretKey,
  getClerkPublishableKey,
} from './environment';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('getNodeEnv', () => {
    it('should return NODE_ENV when set', () => {
      process.env['NODE_ENV'] = 'production';
      expect(getNodeEnv()).toBe('production');
    });

    it('should return "development" as default when NODE_ENV is not set', () => {
      delete process.env['NODE_ENV'];
      expect(getNodeEnv()).toBe('development');
    });
  });

  describe('isProduction', () => {
    it('should return true when NODE_ENV is production', () => {
      process.env['NODE_ENV'] = 'production';
      expect(isProduction()).toBe(true);
    });

    it('should return false when NODE_ENV is development', () => {
      process.env['NODE_ENV'] = 'development';
      expect(isProduction()).toBe(false);
    });

    it('should return false when NODE_ENV is not set', () => {
      delete process.env['NODE_ENV'];
      expect(isProduction()).toBe(false);
    });
  });

  describe('getPort', () => {
    it('should return PORT when set to valid number', () => {
      process.env['PORT'] = '8080';
      expect(getPort()).toBe(8080);
    });

    it('should return 3333 as default when PORT is not set', () => {
      delete process.env['PORT'];
      expect(getPort()).toBe(3333);
    });

    it('should return 3333 when PORT is not a valid number', () => {
      process.env['PORT'] = 'invalid';
      expect(getPort()).toBe(3333);
    });
  });

  describe('getFrontendUrl', () => {
    it('should return FRONTEND_URL when set', () => {
      process.env['FRONTEND_URL'] = 'https://example.com';
      expect(getFrontendUrl()).toBe('https://example.com');
    });

    it('should return undefined when not set (allows all origins behind proxy)', () => {
      delete process.env['FRONTEND_URL'];
      expect(getFrontendUrl()).toBeUndefined();
    });
  });

  describe('Database configuration', () => {
    it('should return DB_HOST when set', () => {
      process.env['DB_HOST'] = 'db.example.com';
      expect(getDbHost()).toBe('db.example.com');
    });

    it('should warn and return empty string when DB_HOST missing in development', () => {
      process.env['NODE_ENV'] = 'development';
      delete process.env['DB_HOST'];
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      expect(getDbHost()).toBe('');
      expect(warnSpy).toHaveBeenCalledWith(
        '[Environment] Missing DB_HOST - ensure environment variables are loaded',
      );
      warnSpy.mockRestore();
    });

    it('should throw when DB_HOST missing in production', () => {
      process.env['NODE_ENV'] = 'production';
      delete process.env['DB_HOST'];
      expect(() => getDbHost()).toThrow(
        'Missing required environment variable: DB_HOST',
      );
    });

    it('should return DB_PORT when set to valid number', () => {
      process.env['DB_PORT'] = '5433';
      expect(getDbPort()).toBe(5433);
    });

    it('should return 5432 when DB_PORT is invalid', () => {
      process.env['DB_PORT'] = 'invalid';
      expect(getDbPort()).toBe(5432);
    });

    it('should return DB_USERNAME when set', () => {
      process.env['DB_USERNAME'] = 'admin';
      expect(getDbUsername()).toBe('admin');
    });

    it('should warn and return empty string when DB_USERNAME missing in development', () => {
      process.env['NODE_ENV'] = 'development';
      delete process.env['DB_USERNAME'];
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      expect(getDbUsername()).toBe('');
      expect(warnSpy).toHaveBeenCalledWith(
        '[Environment] Missing DB_USERNAME - ensure environment variables are loaded',
      );
      warnSpy.mockRestore();
    });

    it('should return DB_PASSWORD when set', () => {
      process.env['DB_PASSWORD'] = 'secret';
      expect(getDbPassword()).toBe('secret');
    });

    it('should warn and return empty string when DB_PASSWORD missing in development', () => {
      process.env['NODE_ENV'] = 'development';
      delete process.env['DB_PASSWORD'];
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      expect(getDbPassword()).toBe('');
      expect(warnSpy).toHaveBeenCalledWith(
        '[Environment] Missing DB_PASSWORD - ensure environment variables are loaded',
      );
      warnSpy.mockRestore();
    });

    it('should return DB_NAME when set', () => {
      process.env['DB_NAME'] = 'my_database';
      expect(getDbName()).toBe('my_database');
    });

    it('should warn and return empty string when DB_NAME missing in development', () => {
      process.env['NODE_ENV'] = 'development';
      delete process.env['DB_NAME'];
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      expect(getDbName()).toBe('');
      expect(warnSpy).toHaveBeenCalledWith(
        '[Environment] Missing DB_NAME - ensure environment variables are loaded',
      );
      warnSpy.mockRestore();
    });
  });

  describe('getDbSynchronize', () => {
    it('should return true when DB_SYNCHRONIZE is "true"', () => {
      process.env['DB_SYNCHRONIZE'] = 'true';
      expect(getDbSynchronize()).toBe(true);
    });

    it('should return false when DB_SYNCHRONIZE is "false"', () => {
      process.env['DB_SYNCHRONIZE'] = 'false';
      expect(getDbSynchronize()).toBe(false);
    });

    it('should return false when not set (use migrations instead)', () => {
      delete process.env['DB_SYNCHRONIZE'];
      expect(getDbSynchronize()).toBe(false);
    });
  });

  describe('getDbLogging', () => {
    it('should return true when DB_LOGGING is "true"', () => {
      process.env['DB_LOGGING'] = 'true';
      expect(getDbLogging()).toBe(true);
    });

    it('should return true in development when not set', () => {
      process.env['NODE_ENV'] = 'development';
      delete process.env['DB_LOGGING'];
      expect(getDbLogging()).toBe(true);
    });

    it('should return false in production when not set', () => {
      process.env['NODE_ENV'] = 'production';
      delete process.env['DB_LOGGING'];
      expect(getDbLogging()).toBe(false);
    });
  });

  describe('Database Pool Configuration', () => {
    describe('getDbPoolMax', () => {
      it('should return DB_POOL_MAX when set to valid number', () => {
        process.env['DB_POOL_MAX'] = '25';
        expect(getDbPoolMax()).toBe(25);
      });

      it('should return 10 as default when DB_POOL_MAX is not set', () => {
        delete process.env['DB_POOL_MAX'];
        expect(getDbPoolMax()).toBe(10);
      });

      it('should warn and return 10 when DB_POOL_MAX is not a valid number', () => {
        process.env['DB_POOL_MAX'] = 'invalid';
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
        expect(getDbPoolMax()).toBe(10);
        expect(warnSpy).toHaveBeenCalledWith(
          '[Environment] DB_POOL_MAX has invalid value "invalid". ' +
            'Expected an integer. Defaulting to 10.',
        );
        warnSpy.mockRestore();
      });
    });

    describe('getDbPoolMin', () => {
      it('should return DB_POOL_MIN when set to valid number', () => {
        process.env['DB_POOL_MIN'] = '5';
        expect(getDbPoolMin()).toBe(5);
      });

      it('should return 2 as default when DB_POOL_MIN is not set', () => {
        delete process.env['DB_POOL_MIN'];
        expect(getDbPoolMin()).toBe(2);
      });

      it('should warn and return 2 when DB_POOL_MIN is not a valid number', () => {
        process.env['DB_POOL_MIN'] = 'abc';
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
        expect(getDbPoolMin()).toBe(2);
        expect(warnSpy).toHaveBeenCalledWith(
          '[Environment] DB_POOL_MIN has invalid value "abc". ' +
            'Expected an integer. Defaulting to 2.',
        );
        warnSpy.mockRestore();
      });
    });

    describe('getDbPoolIdleTimeout', () => {
      it('should return DB_POOL_IDLE_TIMEOUT when set to valid number', () => {
        process.env['DB_POOL_IDLE_TIMEOUT'] = '60000';
        expect(getDbPoolIdleTimeout()).toBe(60000);
      });

      it('should return 30000 as default when DB_POOL_IDLE_TIMEOUT is not set', () => {
        delete process.env['DB_POOL_IDLE_TIMEOUT'];
        expect(getDbPoolIdleTimeout()).toBe(30000);
      });

      it('should warn and return 30000 when DB_POOL_IDLE_TIMEOUT is not valid', () => {
        process.env['DB_POOL_IDLE_TIMEOUT'] = 'bad';
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
        expect(getDbPoolIdleTimeout()).toBe(30000);
        expect(warnSpy).toHaveBeenCalledWith(
          '[Environment] DB_POOL_IDLE_TIMEOUT has invalid value "bad". ' +
            'Expected an integer in milliseconds. Defaulting to 30000.',
        );
        warnSpy.mockRestore();
      });
    });

    describe('getDbPoolConnectionTimeout', () => {
      it('should return DB_POOL_CONNECTION_TIMEOUT when set to valid number', () => {
        process.env['DB_POOL_CONNECTION_TIMEOUT'] = '10000';
        expect(getDbPoolConnectionTimeout()).toBe(10000);
      });

      it('should return 5000 as default when DB_POOL_CONNECTION_TIMEOUT is not set', () => {
        delete process.env['DB_POOL_CONNECTION_TIMEOUT'];
        expect(getDbPoolConnectionTimeout()).toBe(5000);
      });

      it('should warn and return 5000 when DB_POOL_CONNECTION_TIMEOUT is not valid', () => {
        process.env['DB_POOL_CONNECTION_TIMEOUT'] = 'xyz';
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
        expect(getDbPoolConnectionTimeout()).toBe(5000);
        expect(warnSpy).toHaveBeenCalledWith(
          '[Environment] DB_POOL_CONNECTION_TIMEOUT has invalid value "xyz". ' +
            'Expected an integer in milliseconds. Defaulting to 5000.',
        );
        warnSpy.mockRestore();
      });
    });

    describe('getValidatedPoolConfig', () => {
      it('should return min and max when both are valid and min <= max', () => {
        process.env['DB_POOL_MIN'] = '5';
        process.env['DB_POOL_MAX'] = '20';
        const config = getValidatedPoolConfig();
        expect(config.min).toBe(5);
        expect(config.max).toBe(20);
      });

      it('should warn and clamp min to max when min > max', () => {
        process.env['DB_POOL_MIN'] = '25';
        process.env['DB_POOL_MAX'] = '10';
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
        const config = getValidatedPoolConfig();
        expect(config.min).toBe(10);
        expect(config.max).toBe(10);
        expect(warnSpy).toHaveBeenCalledWith(
          '[Environment] DB_POOL_MIN (25) is greater than DB_POOL_MAX (10). ' +
            'Setting DB_POOL_MIN to 10 to match DB_POOL_MAX.',
        );
        warnSpy.mockRestore();
      });

      it('should use defaults when neither is set', () => {
        delete process.env['DB_POOL_MIN'];
        delete process.env['DB_POOL_MAX'];
        const config = getValidatedPoolConfig();
        expect(config.min).toBe(2);
        expect(config.max).toBe(10);
      });
    });
  });

  describe('getGraphqlIntrospection', () => {
    it('should return true when GRAPHQL_INTROSPECTION is "true"', () => {
      process.env['GRAPHQL_INTROSPECTION'] = 'true';
      expect(getGraphqlIntrospection()).toBe(true);
    });

    it('should return true in development when not set', () => {
      process.env['NODE_ENV'] = 'development';
      delete process.env['GRAPHQL_INTROSPECTION'];
      expect(getGraphqlIntrospection()).toBe(true);
    });

    it('should return false in production when not set', () => {
      process.env['NODE_ENV'] = 'production';
      delete process.env['GRAPHQL_INTROSPECTION'];
      expect(getGraphqlIntrospection()).toBe(false);
    });
  });

  describe('Clerk configuration', () => {
    it('should return CLERK_SECRET_KEY when set', () => {
      process.env['CLERK_SECRET_KEY'] = 'sk_test_123';
      expect(getClerkSecretKey()).toBe('sk_test_123');
    });

    it('should return undefined when CLERK_SECRET_KEY is not set', () => {
      delete process.env['CLERK_SECRET_KEY'];
      expect(getClerkSecretKey()).toBeUndefined();
    });

    it('should return CLERK_PUBLISHABLE_KEY when set', () => {
      process.env['CLERK_PUBLISHABLE_KEY'] = 'pk_test_123';
      expect(getClerkPublishableKey()).toBe('pk_test_123');
    });

    it('should return undefined when CLERK_PUBLISHABLE_KEY is not set', () => {
      delete process.env['CLERK_PUBLISHABLE_KEY'];
      expect(getClerkPublishableKey()).toBeUndefined();
    });

    it('should return empty string when CLERK_PUBLISHABLE_KEY is explicitly set to empty', () => {
      process.env['CLERK_PUBLISHABLE_KEY'] = '';
      expect(getClerkPublishableKey()).toBe('');
    });
  });
});
