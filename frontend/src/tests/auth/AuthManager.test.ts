import { AuthManager } from '../../modules/auth/AuthManager.js';
import { ApiClient } from '../../modules/api/ApiClient.js';
import { UserSession } from '../../types/index.js';

// Mock ApiClient
jest.mock('../../modules/api/ApiClient.js');
const MockApiClient = ApiClient as jest.MockedClass<typeof ApiClient>;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Mock window.setInterval and clearInterval
global.setInterval = jest.fn();
global.clearInterval = jest.fn();

describe('AuthManager', () => {
  let authManager: AuthManager;
  let mockApiClient: jest.Mocked<ApiClient>;
  
  const mockUser = {
    id: '1',
    username: 'testuser',
    role: 'admin' as const
  };
  
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient = new MockApiClient() as jest.Mocked<ApiClient>;
    authManager = new AuthManager(mockApiClient);
  });

  describe('Initialization', () => {
    it('should initialize with existing token from sessionStorage', async () => {
      mockSessionStorage.getItem.mockReturnValue(mockToken);
      mockApiClient.verifyToken.mockResolvedValue({
        success: true,
        data: { user: mockUser, valid: true }
      });

      authManager = new AuthManager(mockApiClient);
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockApiClient.setAuthToken).toHaveBeenCalledWith(mockToken);
      expect(mockApiClient.verifyToken).toHaveBeenCalled();
    });

    it('should handle initialization without existing token', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      authManager = new AuthManager(mockApiClient);

      expect(mockApiClient.setAuthToken).not.toHaveBeenCalled();
    });
  });

  describe('Login', () => {
    it('should handle successful login', async () => {
      mockApiClient.login.mockResolvedValue({
        success: true,
        data: { user: mockUser, token: mockToken }
      });

      const result = await authManager.login('testuser', 'password');

      expect(result.success).toBe(true);
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'userSession',
        expect.stringContaining('"username":"testuser"')
      );
      expect(global.setInterval).toHaveBeenCalled();
    });

    it('should handle login failure', async () => {
      mockApiClient.login.mockResolvedValue({
        success: false,
        data: null,
        error: 'Invalid credentials'
      });

      const result = await authManager.login('testuser', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle login exception', async () => {
      mockApiClient.login.mockRejectedValue(new Error('Network error'));

      const result = await authManager.login('testuser', 'password');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('Logout', () => {
    it('should handle successful logout', async () => {
      mockApiClient.logout.mockResolvedValue({ success: true, data: undefined });

      await authManager.logout();

      expect(mockApiClient.logout).toHaveBeenCalled();
      expect(mockApiClient.clearAuthToken).toHaveBeenCalled();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('userSession');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('authToken');
      expect(global.clearInterval).toHaveBeenCalled();
    });

    it('should handle logout API failure gracefully', async () => {
      mockApiClient.logout.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await authManager.logout();

      expect(consoleSpy).toHaveBeenCalledWith('Logout API call failed:', expect.any(Error));
      expect(mockApiClient.clearAuthToken).toHaveBeenCalled();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('userSession');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Session Management', () => {
    const mockSession: UserSession = {
      username: 'testuser',
      role: 'admin',
      loginTime: '2023-01-01T00:00:00Z',
      isAuthenticated: true
    };

    it('should get current session from memory', () => {
      (authManager as any).currentSession = mockSession;

      const session = authManager.getCurrentSession();

      expect(session).toEqual(mockSession);
    });

    it('should restore session from sessionStorage', () => {
      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockSession));

      const session = authManager.getCurrentSession();

      expect(session).toEqual(mockSession);
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('userSession');
    });

    it('should handle invalid session data in sessionStorage', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid-json');
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const session = authManager.getCurrentSession();

      expect(session).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse stored session:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should check authentication status', () => {
      (authManager as any).currentSession = mockSession;
      mockSessionStorage.getItem.mockReturnValue(mockToken);

      const isAuth = authManager.isAuthenticated();

      expect(isAuth).toBe(true);
    });

    it('should return false for authentication without token', () => {
      (authManager as any).currentSession = mockSession;
      mockSessionStorage.getItem.mockReturnValue(null);

      const isAuth = authManager.isAuthenticated();

      expect(isAuth).toBe(false);
    });
  });

  describe('Role-based Access Control', () => {
    const adminSession: UserSession = {
      username: 'admin',
      role: 'admin',
      loginTime: '2023-01-01T00:00:00Z',
      isAuthenticated: true
    };

    beforeEach(() => {
      mockSessionStorage.getItem.mockReturnValue(mockToken);
    });

    it('should check admin privileges correctly', () => {
      (authManager as any).currentSession = adminSession;

      expect(authManager.isAdmin()).toBe(true);
    });

    it('should return false for admin check when not authenticated', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      expect(authManager.isAdmin()).toBe(false);
    });
  });

  describe('Session Validation', () => {
    it('should validate session successfully', async () => {
      mockApiClient.verifyToken.mockResolvedValue({
        success: true,
        data: { user: mockUser, valid: true }
      });

      const isValid = await (authManager as any).validateSession();

      expect(isValid).toBe(true);
      expect(mockApiClient.verifyToken).toHaveBeenCalled();
    });

    it('should handle invalid session', async () => {
      mockApiClient.verifyToken.mockResolvedValue({
        success: false,
        data: null,
        error: 'Token expired'
      });

      const isValid = await (authManager as any).validateSession();

      expect(isValid).toBe(false);
      expect(mockApiClient.clearAuthToken).toHaveBeenCalled();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('userSession');
    });

    it('should handle session validation error', async () => {
      mockApiClient.verifyToken.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const isValid = await (authManager as any).validateSession();

      expect(isValid).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Session validation failed:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Session Duration', () => {
    it('should calculate session duration', () => {
      const loginTime = new Date('2023-01-01T00:00:00Z');
      const mockSession: UserSession = {
        username: 'testuser',
        role: 'admin',
        loginTime: loginTime.toISOString(),
        isAuthenticated: true
      };

      (authManager as any).currentSession = mockSession;
      
      // Mock current time to be 1 hour later
      const mockNow = new Date('2023-01-01T01:00:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(mockNow.getTime());

      const duration = authManager.getSessionDuration();
      const expectedDuration = 60 * 60 * 1000; // 1 hour in milliseconds

      expect(duration).toBe(expectedDuration);
    });

    it('should format session duration correctly', () => {
      const loginTime = new Date('2023-01-01T00:00:00Z');
      const mockSession: UserSession = {
        username: 'testuser',
        role: 'admin',
        loginTime: loginTime.toISOString(),
        isAuthenticated: true
      };

      (authManager as any).currentSession = mockSession;
      
      // Mock current time to be 1 hour 30 minutes later
      const mockNow = new Date('2023-01-01T01:30:00Z');
      jest.spyOn(Date, 'now').mockReturnValue(mockNow.getTime());

      const formatted = authManager.getFormattedSessionDuration();

      expect(formatted).toBe('1h 30m');
    });

    it('should check if session is near expiry', () => {
      const loginTime = new Date();
      loginTime.setHours(loginTime.getHours() - 7); // 7 hours ago (near 8-hour expiry)
      
      const mockSession: UserSession = {
        username: 'testuser',
        role: 'admin',
        loginTime: loginTime.toISOString(),
        isAuthenticated: true
      };

      (authManager as any).currentSession = mockSession;

      const isNearExpiry = authManager.isSessionNearExpiry();

      expect(isNearExpiry).toBe(false); // Not within 10 minutes of 8-hour limit
    });
  });

  describe('Session Monitoring', () => {
    it('should start session monitoring on login', async () => {
      mockApiClient.login.mockResolvedValue({
        success: true,
        data: { user: mockUser, token: mockToken }
      });

      await authManager.login('testuser', 'password');

      expect(global.setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        5 * 60 * 1000 // 5 minutes
      );
    });

    it('should stop session monitoring on logout', async () => {
      mockApiClient.logout.mockResolvedValue({ success: true, data: undefined });

      await authManager.logout();

      expect(global.clearInterval).toHaveBeenCalled();
    });

    it('should refresh session', async () => {
      mockApiClient.verifyToken.mockResolvedValue({
        success: true,
        data: { user: mockUser, valid: true }
      });

      const result = await authManager.refreshSession();

      expect(result).toBe(true);
      expect(mockApiClient.verifyToken).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup session monitoring', () => {
      authManager.cleanup();

      expect(global.clearInterval).toHaveBeenCalled();
    });
  });
});
