import { ApiClient } from '../api/ApiClient.js';
import { UserSession, User } from '../../types/index.js';

export class AuthManager {
  private apiClient: ApiClient;
  private currentSession: UserSession | null = null;
  private sessionCheckInterval: number | null = null;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
    this.initializeSession();
  }

  // Initialize session from stored token
  private async initializeSession(): Promise<void> {
    const token = sessionStorage.getItem('authToken');
    if (token) {
      this.apiClient.setAuthToken(token);
      await this.validateSession();
    }
  }

  // Login with credentials
  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.apiClient.login(username, password);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Create session
        this.currentSession = {
          username: user.username,
          role: user.role,
          loginTime: new Date().toISOString(),
          isAuthenticated: true
        };

        // Store session data
        sessionStorage.setItem('userSession', JSON.stringify(this.currentSession));
        
        // Start session monitoring
        this.startSessionMonitoring();
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error || 'Login failed' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }

  // Logout and clear session
  async logout(): Promise<void> {
    try {
      await this.apiClient.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
    }

    // Clear session data
    this.currentSession = null;
    sessionStorage.removeItem('userSession');
    sessionStorage.removeItem('authToken');
    
    // Stop session monitoring
    this.stopSessionMonitoring();
    
    // Clear API client token
    this.apiClient.clearAuthToken();
  }

  // Get current session
  getCurrentSession(): UserSession | null {
    if (!this.currentSession) {
      // Try to restore from sessionStorage
      const storedSession = sessionStorage.getItem('userSession');
      if (storedSession) {
        try {
          this.currentSession = JSON.parse(storedSession);
        } catch (error) {
          console.warn('Failed to parse stored session:', error);
          this.clearInvalidSession();
        }
      }
    }
    return this.currentSession;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const session = this.getCurrentSession();
    return session?.isAuthenticated === true && !!sessionStorage.getItem('authToken');
  }

  // Check if user has admin privileges
  isAdmin(): boolean {
    const session = this.getCurrentSession();
    return session?.isAuthenticated === true && session?.role === 'admin' && !!sessionStorage.getItem('authToken');
  }

  // Validate current session with backend
  private async validateSession(): Promise<boolean> {
    try {
      const response = await this.apiClient.verifyToken();
      
      if (response.success && response.data?.valid) {
        // Update session with fresh user data
        if (this.currentSession) {
          this.currentSession.isAuthenticated = true;
          sessionStorage.setItem('userSession', JSON.stringify(this.currentSession));
        }
        return true;
      } else {
        this.clearInvalidSession();
        return false;
      }
    } catch (error) {
      console.warn('Session validation failed:', error);
      this.clearInvalidSession();
      return false;
    }
  }

  // Clear invalid session data
  private clearInvalidSession(): void {
    this.currentSession = null;
    sessionStorage.removeItem('userSession');
    sessionStorage.removeItem('authToken');
    this.apiClient.clearAuthToken();
    this.stopSessionMonitoring();
  }

  // Start periodic session validation
  private startSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    // Check session every 5 minutes
    this.sessionCheckInterval = window.setInterval(async () => {
      const isValid = await this.validateSession();
      if (!isValid) {
        // Emit session expired event
        window.dispatchEvent(new CustomEvent('sessionExpired'));
      }
    }, 5 * 60 * 1000);
  }

  // Stop session monitoring
  private stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  // Get session duration
  getSessionDuration(): number {
    const session = this.getCurrentSession();
    if (!session?.loginTime) {
      return 0;
    }

    const loginTime = new Date(session.loginTime);
    const now = new Date();
    return now.getTime() - loginTime.getTime();
  }

  // Format session duration for display
  getFormattedSessionDuration(): string {
    const duration = this.getSessionDuration();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  // Check if session is about to expire (within 10 minutes)
  isSessionNearExpiry(): boolean {
    const duration = this.getSessionDuration();
    const eightHours = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
    const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
    
    return duration > (eightHours - tenMinutes);
  }

  // Refresh session (extend expiry)
  async refreshSession(): Promise<boolean> {
    return await this.validateSession();
  }

  // Cleanup on page unload
  cleanup(): void {
    this.stopSessionMonitoring();
  }
}
