// Authentication check and session management
class AuthManager {
    constructor() {
        this.sessionKey = 'userSession';
        this.init();
    }

    init() {
        // Check authentication on page load
        if (!this.isAuthenticated() && !this.isLoginPage()) {
            this.redirectToLogin();
        }
    }

    isLoginPage() {
        return window.location.pathname.includes('login.html') || 
               window.location.pathname.endsWith('/login');
    }

    isAuthenticated() {
        try {
            const session = sessionStorage.getItem(this.sessionKey);
            if (!session) return false;

            const userData = JSON.parse(session);
            return userData && userData.isAuthenticated === true;
        } catch (error) {
            console.error('Error checking authentication:', error);
            this.clearSession();
            return false;
        }
    }

    getUserData() {
        try {
            const session = sessionStorage.getItem(this.sessionKey);
            if (!session) return null;

            const userData = JSON.parse(session);
            return userData.isAuthenticated ? userData : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    login(username, role = 'user') {
        const sessionData = {
            username: username,
            role: role,
            loginTime: new Date().toISOString(),
            isAuthenticated: true
        };
        sessionStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
    }

    logout() {
        this.clearSession();
        this.redirectToLogin();
    }

    clearSession() {
        sessionStorage.removeItem(this.sessionKey);
    }

    redirectToLogin() {
        window.location.href = '/login';
    }

    redirectToDashboard() {
        window.location.href = '/dashboard';
    }

    // Add logout functionality to the dashboard
    addLogoutButton() {
        const userData = this.getUserData();
        if (!userData) return;

        // Find a suitable place to add logout button (e.g., in sidebar)
        const sidebarContainer = document.getElementById('sidebar-container');
        if (sidebarContainer) {
            // Add logout button to sidebar after it loads
            setTimeout(() => {
                const sidebar = sidebarContainer.querySelector('.sidebar');
                if (sidebar) {
                    const logoutBtn = document.createElement('div');
                    logoutBtn.className = 'logout-section';
                    logoutBtn.innerHTML = `
                        <div class="user-info">
                            <p>Welcome, ${userData.username}</p>
                            <button onclick="authManager.logout()" class="logout-btn">Logout</button>
                        </div>
                    `;
                    sidebar.appendChild(logoutBtn);

                    // Add styles for logout section
                    const style = document.createElement('style');
                    style.textContent = `
                        .logout-section {
                            margin-top: auto;
                            padding: 1rem;
                            border-top: 1px solid #eee;
                        }
                        .user-info p {
                            color: #666;
                            margin-bottom: 0.5rem;
                            font-size: 0.9rem;
                        }
                        .logout-btn {
                            width: 100%;
                            padding: 0.5rem;
                            background: #dc3545;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 0.9rem;
                        }
                        .logout-btn:hover {
                            background: #c82333;
                        }
                    `;
                    document.head.appendChild(style);
                }
            }, 500);
        }
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Export for global access
window.authManager = authManager;
