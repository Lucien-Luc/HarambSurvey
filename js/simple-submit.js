/**
 * Simple Form Submission Handler
 * Complete rewrite of submission logic
 */

class SimpleFormSubmit {
    constructor() {
        this.form = null;
        this.submitBtn = null;
        this.isSubmitting = false;
    }

    init() {
        console.log('SimpleFormSubmit: Initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        console.log('SimpleFormSubmit: Setting up...');
        
        // Set up navigation first
        this.setupNavigation();
        
        // Find form and button
        this.form = document.getElementById('employerDiagnosticForm');
        this.submitBtn = document.getElementById('submitBtn');
        
        if (!this.form) {
            console.error('SimpleFormSubmit: Form not found');
            return;
        }
        
        if (!this.submitBtn) {
            console.error('SimpleFormSubmit: Submit button not found');
            return;
        }

        // Make submit button visible and styled
        this.submitBtn.style.display = 'block';
        this.submitBtn.style.visibility = 'visible';
        this.submitBtn.style.backgroundColor = '#28a745';
        this.submitBtn.style.color = 'white';
        this.submitBtn.style.padding = '12px 24px';
        this.submitBtn.style.border = 'none';
        this.submitBtn.style.borderRadius = '5px';
        this.submitBtn.style.fontSize = '16px';
        this.submitBtn.style.cursor = 'pointer';
        this.submitBtn.innerHTML = '<i class="fas fa-check"></i> SUBMIT FORM';

        // Remove any existing event listeners
        this.submitBtn.onclick = null;
        
        // Add new click handler
        this.submitBtn.addEventListener('click', (e) => this.handleSubmit(e));
        
        // Set up form navigation
        this.setupFormNavigation();
        
        console.log('SimpleFormSubmit: Setup complete - button is ready');
    }

    setupNavigation() {
        // Handle "Got it" button to show survey form
        const gotItBtn = document.getElementById('gotItBtn');
        if (gotItBtn) {
            gotItBtn.addEventListener('click', () => {
                console.log('Got it button clicked - showing survey');
                this.showView('surveyView');
            });
            console.log('Got it button handler added');
        } else {
            console.warn('Got it button not found');
        }

        // Set up admin access via long press on logo
        this.setupAdminAccess();
    }

    setupAdminAccess() {
        // Find all potential logo elements (header and intro page)
        const logos = document.querySelectorAll('.bpn-logo, #logoContainer img, .logo img');
        
        if (logos.length === 0) {
            console.warn('No BPN logos found for admin access');
            return;
        }

        logos.forEach((logo, index) => {
            let pressTimer;
            let isLongPress = false;

            const startLongPress = (e) => {
                e.preventDefault(); // Prevent default behaviors
                isLongPress = false;
                console.log(`Long press started on logo ${index + 1}`);
                pressTimer = setTimeout(() => {
                    isLongPress = true;
                    console.log('Long press detected - showing admin access');
                    this.showAdminAccess();
                }, 3000); // 3 second long press for better UX
            };

            const endLongPress = (e) => {
                clearTimeout(pressTimer);
                if (isLongPress) {
                    console.log('Long press completed');
                } else {
                    console.log('Short press - no admin access');
                }
            };

            // Touch events for mobile
            logo.addEventListener('touchstart', startLongPress);
            logo.addEventListener('touchend', endLongPress);
            logo.addEventListener('touchcancel', endLongPress);

            // Mouse events for desktop
            logo.addEventListener('mousedown', startLongPress);
            logo.addEventListener('mouseup', endLongPress);
            logo.addEventListener('mouseleave', endLongPress);

            // Prevent context menu on long press
            logo.addEventListener('contextmenu', (e) => e.preventDefault());
        });

        console.log(`Admin access setup complete - long press any BPN logo (${logos.length} logos found)`);
    }

    async showAdminAccess() {
        // Check if admin exists and authenticate
        const adminExists = await this.checkAdminExists();
        
        if (!adminExists) {
            this.showAdminSetup();
        } else {
            this.showAdminLogin();
        }
    }

    async checkAdminExists() {
        try {
            if (window.firebaseConfig && window.firebaseConfig.getCollection) {
                console.log('Checking admin existence...');
                const result = await window.firebaseConfig.getCollection('admins');
                console.log('Admin collection result:', result);
                
                if (result.success && result.data && result.data.length > 0) {
                    console.log('Admin exists: true');
                    return true;
                } else {
                    console.log('Admin exists: false');
                    return false;
                }
            }
            console.log('Firebase not available');
            return false;
        } catch (error) {
            console.log('Error checking admin existence:', error);
            return false;
        }
    }

    showAdminSetup() {
        const popup = document.createElement('div');
        popup.className = 'notification-overlay';
        popup.innerHTML = `
            <div class="notification-popup" style="max-width: 400px;">
                <div class="notification-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h1 class="notification-title">Admin Setup</h1>
                <p class="notification-message">Set up the admin password. This can only be done once.</p>
                <div class="auth-form">
                    <input type="password" id="adminSetupPassword" placeholder="Enter admin password" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;">
                    <input type="password" id="adminConfirmPassword" placeholder="Confirm password" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;">
                    <button onclick="window.simpleFormSubmit.createAdmin()" style="width: 100%; padding: 10px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Create Admin
                    </button>
                </div>
                <button class="notification-action" onclick="this.closest('.notification-overlay').remove()">
                    Cancel
                </button>
            </div>
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.classList.add('show'), 100);
    }

    showAdminLogin() {
        const popup = document.createElement('div');
        popup.className = 'notification-overlay';
        popup.innerHTML = `
            <div class="notification-popup" style="max-width: 400px;">
                <div class="notification-icon" style="background: linear-gradient(135deg, #667eea, #764ba2);">
                    <i class="fas fa-lock"></i>
                </div>
                <h1 class="notification-title">Admin Login</h1>
                <p class="notification-message">Enter admin password to access the panel.</p>
                <div class="auth-form">
                    <input type="password" id="adminLoginPassword" placeholder="Enter password" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;">
                    <button onclick="window.simpleFormSubmit.loginAdmin()" style="width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Login
                    </button>
                </div>
                <button class="notification-action" onclick="this.closest('.notification-overlay').remove()">
                    Cancel
                </button>
            </div>
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.classList.add('show'), 100);
        
        // Focus on password input
        setTimeout(() => {
            document.getElementById('adminLoginPassword').focus();
        }, 200);
    }

    async createAdmin() {
        const password = document.getElementById('adminSetupPassword').value;
        const confirmPassword = document.getElementById('adminConfirmPassword').value;
        
        if (!password || password.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        try {
            // Create admin in Firebase
            if (window.firebaseConfig && window.firebaseConfig.createDocument) {
                const result = await window.firebaseConfig.createDocument('admins', {
                    password: password,
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                });
                
                if (result.success) {
                    // Close popup and show admin panel
                    const popup = document.querySelector('.notification-overlay');
                    if (popup) {
                        popup.remove();
                    }
                    this.showAdminPanel();
                    Utils.showSuccess('Admin account created successfully');
                } else {
                    alert('Error creating admin account: ' + result.error);
                }
            } else {
                alert('Firebase not available. Cannot create admin account.');
            }
        } catch (error) {
            console.error('Error creating admin:', error);
            alert('Error creating admin account: ' + error.message);
        }
    }

    async loginAdmin() {
        const password = document.getElementById('adminLoginPassword').value;
        console.log('Login attempt with password:', password ? '***' : 'empty');
        
        if (!password) {
            alert('Please enter password');
            return;
        }
        
        try {
            // Check password in Firebase
            if (window.firebaseConfig && window.firebaseConfig.getCollection) {
                console.log('Getting admin collection...');
                const result = await window.firebaseConfig.getCollection('admins');
                console.log('Admin collection result:', result);
                
                if (result.success && result.data && result.data.length > 0) {
                    const admin = result.data[0];
                    console.log('Admin found:', admin);
                    
                    if (admin.password === password) {
                        console.log('Password matches - logging in...');
                        
                        // Update last login
                        await window.firebaseConfig.updateDocument('admins', admin.id, {
                            lastLogin: new Date().toISOString()
                        });
                        
                        // Close popup and show admin panel
                        const popup = document.querySelector('.notification-overlay');
                        if (popup) {
                            popup.remove();
                        }
                        
                        console.log('Showing admin panel...');
                        this.showAdminPanel();
                        
                        Utils.showSuccess('Login successful');
                    } else {
                        console.log('Password mismatch');
                        alert('Invalid password');
                    }
                } else {
                    console.log('No admin found in collection');
                    alert('No admin account found');
                }
            } else {
                console.log('Firebase not available');
                alert('Firebase not available. Cannot authenticate.');
            }
        } catch (error) {
            console.error('Error logging in:', error);
            alert('Error logging in: ' + error.message);
        }
    }

    showAdminPanel() {
        console.log('showAdminPanel called');
        
        // Create admin view if it doesn't exist
        if (!document.getElementById('adminView')) {
            console.log('Creating admin view...');
            this.createAdminView();
        } else {
            console.log('Admin view already exists');
        }
        
        // Show admin interface
        console.log('Switching to admin view...');
        this.showView('adminView');
        
        // Load admin data
        console.log('Loading admin data...');
        this.loadAdminData();
    }

    createAdminView() {
        const adminView = document.createElement('div');
        adminView.id = 'adminView';
        adminView.className = 'view';
        adminView.innerHTML = `
            <div class="admin-container">
                <div class="admin-header">
                    <h1><i class="fas fa-shield-alt"></i> Admin Panel</h1>
                    <div class="admin-header-buttons">
                        <button class="btn btn-warning" onclick="window.simpleFormSubmit.logoutAdmin()">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                        <button class="btn btn-secondary" onclick="window.simpleFormSubmit.showView('surveyView')">
                            <i class="fas fa-arrow-left"></i> Back to Survey
                        </button>
                    </div>
                </div>
                
                <div class="admin-content">
                    <div class="admin-section">
                        <h2><i class="fas fa-chart-bar"></i> Survey Responses</h2>
                        <div class="admin-stats">
                            <div class="stat-card">
                                <div class="stat-number" id="totalResponses">0</div>
                                <div class="stat-label">Total Responses</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" id="todayResponses">0</div>
                                <div class="stat-label">Today</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-number" id="avgCompletionTime">0</div>
                                <div class="stat-label">Avg. Time (min)</div>
                            </div>
                        </div>
                        
                        <div class="admin-actions">
                            <button class="btn btn-primary" onclick="window.simpleFormSubmit.exportResponses()">
                                <i class="fas fa-download"></i> Export to Excel
                            </button>
                            <button class="btn btn-secondary" onclick="window.simpleFormSubmit.viewResponses()">
                                <i class="fas fa-eye"></i> View Responses
                            </button>
                        </div>
                    </div>

                    <div class="admin-section">
                        <h2><i class="fas fa-database"></i> Data Management</h2>
                        <div class="data-actions">
                            <button class="btn btn-info" onclick="window.simpleFormSubmit.refreshData()">
                                <i class="fas fa-refresh"></i> Refresh Data
                            </button>
                            <button class="btn btn-warning" onclick="window.simpleFormSubmit.clearLocalStorage()">
                                <i class="fas fa-trash"></i> Clear Local Storage
                            </button>
                        </div>
                    </div>

                    <div class="admin-section">
                        <h2><i class="fas fa-list"></i> Recent Responses</h2>
                        <div class="responses-list" id="recentResponses">
                            <div class="loading-placeholder">Loading responses...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to main content
        document.querySelector('.main-content').appendChild(adminView);
        
        // Add admin styles
        this.addAdminStyles();
    }

    addAdminStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #adminView {
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                min-height: 100vh;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .admin-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem;
            }
            
            .admin-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                padding: 1.5rem 2rem;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
            }
            
            .admin-header-buttons {
                display: flex;
                gap: 12px;
            }
            
            .admin-header h1 {
                color: #2d3748;
                margin: 0;
                font-size: 2rem;
                font-weight: 700;
                background: linear-gradient(135deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .admin-section {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 20px;
                padding: 2rem;
                margin-bottom: 1.5rem;
                box-shadow: 0 10px 30px rgba(0,0,0,0.08);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            
            .admin-section:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 40px rgba(0,0,0,0.12);
            }
            
            .admin-section h2 {
                color: #2d3748;
                margin-top: 0;
                margin-bottom: 1.5rem;
                font-size: 1.25rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .admin-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .stat-card {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 2rem;
                border-radius: 16px;
                text-align: center;
                position: relative;
                overflow: hidden;
                transition: transform 0.3s ease;
            }
            
            .stat-card:hover {
                transform: translateY(-5px);
            }
            
            .stat-card::before {
                content: '';
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                animation: shimmer 3s infinite;
            }
            
            @keyframes shimmer {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .stat-number {
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                position: relative;
                z-index: 1;
            }
            
            .stat-label {
                font-size: 0.9rem;
                opacity: 0.9;
                font-weight: 500;
                position: relative;
                z-index: 1;
            }
            
            .admin-actions, .data-actions {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
            
            .btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 12px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 500;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                text-decoration: none;
                position: relative;
                overflow: hidden;
            }
            
            .btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.5s;
            }
            
            .btn:hover::before {
                left: 100%;
            }
            
            .btn-primary { 
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            }
            
            .btn-secondary { 
                background: linear-gradient(135deg, #6c757d, #5a6268);
                color: white;
                box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
            }
            
            .btn-info { 
                background: linear-gradient(135deg, #17a2b8, #138496);
                color: white;
                box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);
            }
            
            .btn-warning { 
                background: linear-gradient(135deg, #ffc107, #e0a800);
                color: #212529;
                box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
            }
            
            .btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            }
            
            .btn:active {
                transform: translateY(-1px);
            }
            
            .responses-list {
                max-height: 400px;
                overflow-y: auto;
                border-radius: 12px;
                padding: 1rem;
                background: rgba(248, 250, 252, 0.8);
                border: 1px solid rgba(226, 232, 240, 0.5);
            }
            
            .response-item {
                padding: 1rem;
                border-bottom: 1px solid rgba(226, 232, 240, 0.5);
                margin-bottom: 1rem;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.7);
                transition: all 0.3s ease;
            }
            
            .response-item:hover {
                background: rgba(255, 255, 255, 0.9);
                transform: translateX(5px);
            }
            
            .response-item:last-child {
                border-bottom: none;
                margin-bottom: 0;
            }
            
            .response-item strong {
                color: #2d3748;
                font-weight: 600;
            }
            
            .response-item small {
                color: #718096;
                font-size: 0.85rem;
            }
            
            .loading-placeholder {
                text-align: center;
                color: #a0aec0;
                font-style: italic;
                padding: 2rem;
            }
            
            /* Responsive Design */
            @media (max-width: 768px) {
                .admin-container {
                    padding: 1rem;
                }
                
                .admin-header {
                    flex-direction: column;
                    gap: 1rem;
                    text-align: center;
                }
                
                .admin-header h1 {
                    font-size: 1.5rem;
                }
                
                .admin-stats {
                    grid-template-columns: 1fr;
                }
                
                .admin-actions, .data-actions {
                    flex-direction: column;
                }
                
                .btn {
                    justify-content: center;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    loadAdminData() {
        // Load data from localStorage and Firebase
        const localData = JSON.parse(localStorage.getItem('employer-submissions') || '[]');
        const totalResponses = localData.length;
        
        // Update stats
        document.getElementById('totalResponses').textContent = totalResponses;
        document.getElementById('todayResponses').textContent = this.getTodayResponseCount(localData);
        document.getElementById('avgCompletionTime').textContent = this.getAverageCompletionTime(localData);
        
        // Load recent responses
        this.displayRecentResponses(localData);
        
        // Try to load from Firebase if available
        if (window.firebaseConfig && window.firebaseConfig.isInitialized) {
            this.loadFirebaseData();
        }
    }

    getTodayResponseCount(responses) {
        const today = new Date().toDateString();
        return responses.filter(r => new Date(r.timestamp).toDateString() === today).length;
    }

    getAverageCompletionTime(responses) {
        if (responses.length === 0) return 0;
        const avgMs = responses.reduce((sum, r) => sum + (r.completionTime || 0), 0) / responses.length;
        return Math.round(avgMs / 60000); // Convert to minutes
    }

    displayRecentResponses(responses) {
        const container = document.getElementById('recentResponses');
        
        if (responses.length === 0) {
            container.innerHTML = '<div class="loading-placeholder">No responses yet</div>';
            return;
        }
        
        const recent = responses.slice(-5).reverse(); // Last 5 responses
        
        container.innerHTML = recent.map(response => `
            <div class="response-item">
                <strong>${response.companyName || 'Unknown Company'}</strong>
                <br>
                <small>Submitted: ${new Date(response.timestamp).toLocaleString()}</small>
                <br>
                <small>Industry: ${response.industry || 'Not specified'}</small>
            </div>
        `).join('');
    }

    exportResponses() {
        const responses = JSON.parse(localStorage.getItem('employer-submissions') || '[]');
        
        if (responses.length === 0) {
            Utils.showWarning('No responses to export');
            return;
        }
        
        try {
            Utils.exportToExcel(responses, 'survey-responses.xlsx');
            Utils.showSuccess('Responses exported successfully');
        } catch (error) {
            Utils.showError('Failed to export responses: ' + error.message);
        }
    }

    viewResponses() {
        const responses = JSON.parse(localStorage.getItem('employer-submissions') || '[]');
        
        if (responses.length === 0) {
            Utils.showWarning('No responses to view');
            return;
        }
        
        // Create detailed view popup
        const popup = document.createElement('div');
        popup.className = 'notification-overlay';
        popup.innerHTML = `
            <div class="notification-popup" style="max-width: 80%; max-height: 80%; overflow-y: auto;">
                <div class="notification-header">
                    <h2>Survey Responses (${responses.length})</h2>
                    <button onclick="this.closest('.notification-overlay').remove()" style="float: right;">×</button>
                </div>
                <div class="responses-detail">
                    ${responses.map((response, index) => `
                        <div class="response-detail" style="border-bottom: 1px solid #eee; padding: 15px 0;">
                            <h4>Response #${index + 1} - ${response.companyName || 'Unknown'}</h4>
                            <p><strong>Submitted:</strong> ${new Date(response.timestamp).toLocaleString()}</p>
                            <p><strong>Industry:</strong> ${response.industry || 'Not specified'}</p>
                            <p><strong>Company Size:</strong> ${response.companySize || 'Not specified'}</p>
                            <p><strong>Hiring Goals:</strong> ${response.hiringGoals || 'Not specified'}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.classList.add('show'), 100);
    }

    refreshData() {
        this.loadAdminData();
        Utils.showSuccess('Data refreshed');
    }

    clearLocalStorage() {
        if (confirm('Are you sure you want to clear all local storage data? This cannot be undone.')) {
            localStorage.removeItem('employer-submissions');
            localStorage.removeItem('latest-submission');
            this.loadAdminData();
            Utils.showSuccess('Local storage cleared');
        }
    }

    async loadFirebaseData() {
        try {
            const responses = await window.firebaseConfig.getCollection('employer-diagnostics', 'timestamp', 50);
            if (responses && responses.length > 0) {
                // Update display with Firebase data
                document.getElementById('totalResponses').textContent = responses.length;
                Utils.showSuccess('Firebase data loaded');
            }
        } catch (error) {
            console.log('Firebase data not available:', error.message);
        }
    }

    logoutAdmin() {
        // Simple logout - just go back to survey
        this.showView('surveyView');
        Utils.showSuccess('Logged out successfully');
    }

    setupFormNavigation() {
        // Handle Next/Previous buttons for multi-step form
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSection());
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevSection());
        }
        
        // Initialize form state
        this.currentSection = 1;
        this.totalSections = document.querySelectorAll('.survey-section').length;
        this.updateProgress();
        this.updateNavigation();
    }

    showView(viewId) {
        const currentView = document.querySelector('.view.active');
        const targetView = document.getElementById(viewId);
        
        if (!targetView) {
            console.error('View not found:', viewId);
            return;
        }
        
        // If there's a current view, slide it out
        if (currentView) {
            currentView.classList.add('slide-out');
            currentView.classList.remove('active');
            
            // Clean up slide-out class after animation
            setTimeout(() => {
                currentView.classList.remove('slide-out');
            }, 800);
        }
        
        // Show target view with slide-in animation
        setTimeout(() => {
            targetView.classList.add('active');
            console.log('Switched to view:', viewId);
        }, currentView ? 100 : 0);
    }

    nextSection() {
        if (this.currentSection < this.totalSections) {
            this.showSection(this.currentSection + 1);
        }
    }

    prevSection() {
        if (this.currentSection > 1) {
            this.showSection(this.currentSection - 1);
        }
    }

    showSection(sectionNumber) {
        // Hide current section
        const sections = document.querySelectorAll('.survey-section');
        sections.forEach(section => section.classList.remove('active'));
        
        // Show target section
        const targetSection = document.getElementById(`section${sectionNumber}`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionNumber;
            this.updateProgress();
            this.updateNavigation();
            console.log('Switched to section:', sectionNumber);
        }
    }

    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) {
            const percentage = (this.currentSection / this.totalSections) * 100;
            progressFill.style.width = percentage + '%';
        }
        
        if (progressText) {
            progressText.textContent = `Section ${this.currentSection} of ${this.totalSections}`;
        }
    }

    updateNavigation() {
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');
        
        // Show/hide previous button
        if (prevBtn) {
            prevBtn.style.display = this.currentSection > 1 ? 'flex' : 'none';
        }

        // Show/hide next vs submit button
        if (this.currentSection === this.totalSections) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (this.submitBtn) this.submitBtn.style.display = 'flex';
        } else {
            if (nextBtn) nextBtn.style.display = 'flex';
            if (this.submitBtn) this.submitBtn.style.display = 'none';
        }
    }

    handleSubmit(event) {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('SimpleFormSubmit: Submit clicked!');
        
        if (this.isSubmitting) {
            console.log('SimpleFormSubmit: Already submitting, ignoring click');
            return;
        }
        
        this.isSubmitting = true;
        this.submitBtn.disabled = true;
        this.submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        
        try {
            this.processSubmission();
        } catch (error) {
            console.error('SimpleFormSubmit: Error during submission:', error);
            alert('Error during submission: ' + error.message);
            this.resetButton();
        }
    }

    processSubmission() {
        console.log('SimpleFormSubmit: Processing submission...');
        
        // Collect all form data
        const formData = this.collectFormData();
        
        console.log('SimpleFormSubmit: Form data collected:', formData);
        
        // Save to localStorage
        this.saveToLocalStorage(formData);
        
        // Try Firebase if available
        this.tryFirebaseSubmission(formData);
        
        // Show success
        this.showSuccess(formData);
    }

    collectFormData() {
        const data = {
            submissionId: 'SUBMIT_' + Date.now(),
            submittedAt: new Date().toISOString(),
            formType: 'employer-diagnostic'
        };
        
        // Get all form inputs
        const inputs = this.form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            const name = input.name || input.id;
            if (!name) return;
            
            if (input.type === 'checkbox') {
                if (input.checked) {
                    if (!data[name]) data[name] = [];
                    data[name].push(input.value);
                }
            } else if (input.type === 'radio') {
                if (input.checked) {
                    data[name] = input.value;
                }
            } else if (input.value && input.value.trim()) {
                data[name] = input.value.trim();
            }
        });
        
        return data;
    }

    saveToLocalStorage(data) {
        try {
            const submissions = JSON.parse(localStorage.getItem('employer-submissions') || '[]');
            submissions.push(data);
            localStorage.setItem('employer-submissions', JSON.stringify(submissions));
            localStorage.setItem('latest-submission', JSON.stringify(data));
            
            console.log('SimpleFormSubmit: Saved to localStorage. Total submissions:', submissions.length);
            console.table([data]);
            
        } catch (error) {
            console.error('SimpleFormSubmit: LocalStorage save failed:', error);
        }
    }

    tryFirebaseSubmission(data) {
        try {
            // Check if Firebase is available
            if (window.firebaseConfig && window.firebaseConfig.createDocument) {
                console.log('SimpleFormSubmit: Attempting Firebase submission...');
                
                window.firebaseConfig.createDocument('employer-diagnostics', data)
                    .then(() => {
                        console.log('SimpleFormSubmit: Firebase submission successful');
                    })
                    .catch(error => {
                        console.warn('SimpleFormSubmit: Firebase submission failed:', error);
                    });
            } else {
                console.log('SimpleFormSubmit: Firebase not available, using localStorage only');
            }
        } catch (error) {
            console.warn('SimpleFormSubmit: Firebase attempt failed:', error);
        }
    }

    showSuccess(data) {
        console.log('SimpleFormSubmit: Showing beautiful success popup');
        
        // Create beautiful popup overlay
        const popup = document.createElement('div');
        popup.className = 'notification-overlay';
        popup.innerHTML = `
            <div class="notification-popup">
                <div class="notification-icon">
                    <i class="fas fa-check"></i>
                </div>
                <h1 class="notification-title">Success!</h1>
                <p class="notification-message">Your employer diagnostic form has been submitted successfully.</p>
                <div class="notification-details">
                    <strong>Submission ID:</strong> ${data.submissionId}<br>
                    <strong>Time:</strong> ${new Date(data.submittedAt).toLocaleString()}
                </div>
                <button class="notification-action" onclick="window.location.reload()">
                    Submit Another Form
                </button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(popup);
        
        // Show with animation
        setTimeout(() => {
            popup.classList.add('show');
        }, 100);
        
        // Auto-remove after clicking or timeout
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                this.hideNotification(popup);
            }
        });
        
        // Auto-hide after 8 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                this.hideNotification(popup);
            }
        }, 8000);
    }

    hideNotification(popup) {
        popup.classList.remove('show');
        setTimeout(() => {
            if (popup.parentNode) {
                popup.parentNode.removeChild(popup);
            }
        }, 300);
    }

    resetButton() {
        this.isSubmitting = false;
        this.submitBtn.disabled = false;
        this.submitBtn.innerHTML = '<i class="fas fa-check"></i> SUBMIT FORM';
    }
}

// Initialize immediately
const simpleSubmit = new SimpleFormSubmit();
simpleSubmit.init();

// Make globally available for debugging and admin panel
window.simpleSubmit = simpleSubmit;
window.simpleFormSubmit = simpleSubmit;