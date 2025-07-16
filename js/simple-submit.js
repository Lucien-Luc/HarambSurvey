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
        
        // Ensure we have some test data for demo purposes
        this.ensureTestData();
        
        // Load admin data with a small delay to ensure DOM is ready
        setTimeout(() => {
            console.log('Loading admin data...');
            this.loadAdminData();
        }, 100);
    }
    
    ensureTestData() {
        const existingData = JSON.parse(localStorage.getItem('employer-submissions') || '[]');
        
        if (existingData.length === 0) {
            console.log('No existing data, creating test data...');
            const testData = [
                {
                    companyName: 'TechCorp Solutions',
                    industry: 'Technology',
                    companySize: '50-200 employees',
                    yearsInBusiness: '5-10 years',
                    hiringGoals: 'Scale technical team',
                    specificRoles: 'Software Engineers, Data Scientists',
                    experienceLevel: 'Mid-level',
                    budgetRange: '$50,000 - $100,000',
                    timeline: '3-6 months',
                    challenges: 'Finding skilled developers',
                    skillsRequired: 'JavaScript, Python, React',
                    location: 'Cape Town',
                    remoteWork: 'Hybrid',
                    additionalComments: 'Looking for passionate developers',
                    timestamp: Date.now() - 86400000, // 1 day ago
                    completionTime: 420000 // 7 minutes
                },
                {
                    companyName: 'Green Energy Co',
                    industry: 'Renewable Energy',
                    companySize: '10-50 employees',
                    yearsInBusiness: '2-5 years',
                    hiringGoals: 'Expand operations team',
                    specificRoles: 'Project Managers, Engineers',
                    experienceLevel: 'Senior',
                    budgetRange: '$40,000 - $80,000',
                    timeline: '1-3 months',
                    challenges: 'Limited candidate pool',
                    skillsRequired: 'Project management, Engineering',
                    location: 'Johannesburg',
                    remoteWork: 'On-site',
                    additionalComments: 'Urgent hiring needed',
                    timestamp: Date.now() - 3600000, // 1 hour ago
                    completionTime: 360000 // 6 minutes
                },
                {
                    companyName: 'FinanceMax Ltd',
                    industry: 'Financial Services',
                    companySize: '200-500 employees',
                    yearsInBusiness: '10+ years',
                    hiringGoals: 'Digital transformation',
                    specificRoles: 'Business Analysts, Developers',
                    experienceLevel: 'Entry-level',
                    budgetRange: '$30,000 - $60,000',
                    timeline: '6+ months',
                    challenges: 'Skills gap in digital tools',
                    skillsRequired: 'SQL, Analytics, Finance',
                    location: 'Durban',
                    remoteWork: 'Remote',
                    additionalComments: 'Training provided',
                    timestamp: Date.now() - 7200000, // 2 hours ago
                    completionTime: 480000 // 8 minutes
                }
            ];
            
            localStorage.setItem('employer-submissions', JSON.stringify(testData));
            console.log('Test data created');
        }
    }

    createAdminView() {
        const adminView = document.createElement('div');
        adminView.id = 'adminView';
        adminView.className = 'view';
        adminView.innerHTML = `
            <div class="admin-container">
                <!-- Header Section -->
                <div class="admin-header">
                    <div class="admin-header-left">
                        <h1><i class="fas fa-shield-alt"></i> Talent Fair Dashboard</h1>
                        <p class="admin-subtitle">Employer Registration & Analytics</p>
                    </div>
                    <div class="admin-header-right">
                        <button class="btn btn-warning" onclick="window.simpleFormSubmit.logoutAdmin()">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                        <button class="btn btn-secondary" onclick="window.simpleFormSubmit.showView('surveyView')">
                            <i class="fas fa-arrow-left"></i> Back to Survey
                        </button>
                    </div>
                </div>
                
                <!-- Main Dashboard Grid -->
                <div class="admin-grid">
                    <!-- Left Column: Stats & Quick Actions -->
                    <div class="admin-left-column">
                        <!-- Statistics Cards -->
                        <div class="stats-section">
                            <div class="section-title">
                                <i class="fas fa-chart-bar"></i>
                                <span>Talent Fair Overview</span>
                            </div>
                            <div class="stats-grid">
                                <div class="stat-card primary">
                                    <div class="stat-icon">
                                        <i class="fas fa-building"></i>
                                    </div>
                                    <div class="stat-content">
                                        <div class="stat-number" id="totalEmployers">0</div>
                                        <div class="stat-label">Registered Employers</div>
                                    </div>
                                </div>
                                <div class="stat-card success">
                                    <div class="stat-icon">
                                        <i class="fas fa-users"></i>
                                    </div>
                                    <div class="stat-content">
                                        <div class="stat-number" id="totalPositions">0</div>
                                        <div class="stat-label">Job Openings</div>
                                    </div>
                                </div>
                                <div class="stat-card info">
                                    <div class="stat-icon">
                                        <i class="fas fa-industry"></i>
                                    </div>
                                    <div class="stat-content">
                                        <div class="stat-number" id="topIndustry">-</div>
                                        <div class="stat-label">Top Industry</div>
                                    </div>
                                </div>
                                <div class="stat-card warning">
                                    <div class="stat-icon">
                                        <i class="fas fa-clock"></i>
                                    </div>
                                    <div class="stat-content">
                                        <div class="stat-number" id="urgentHiring">0</div>
                                        <div class="stat-label">Urgent Hiring</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Quick Actions -->
                        <div class="actions-section">
                            <div class="section-title">
                                <i class="fas fa-bolt"></i>
                                <span>Quick Actions</span>
                            </div>
                            <div class="actions-grid">
                                <button class="action-card primary" onclick="window.simpleFormSubmit.exportResponses()">
                                    <div class="action-icon">
                                        <i class="fas fa-download"></i>
                                    </div>
                                    <div class="action-content">
                                        <div class="action-title">Export Data</div>
                                        <div class="action-desc">Download Excel report</div>
                                    </div>
                                </button>
                                <button class="action-card secondary" onclick="window.simpleFormSubmit.viewResponses()">
                                    <div class="action-icon">
                                        <i class="fas fa-eye"></i>
                                    </div>
                                    <div class="action-content">
                                        <div class="action-title">View All</div>
                                        <div class="action-desc">Browse responses</div>
                                    </div>
                                </button>
                                <button class="action-card info" onclick="window.simpleFormSubmit.refreshData()">
                                    <div class="action-icon">
                                        <i class="fas fa-sync-alt"></i>
                                    </div>
                                    <div class="action-content">
                                        <div class="action-title">Refresh</div>
                                        <div class="action-desc">Reload data</div>
                                    </div>
                                </button>
                                <button class="action-card warning" onclick="window.simpleFormSubmit.clearLocalStorage()">
                                    <div class="action-icon">
                                        <i class="fas fa-trash-alt"></i>
                                    </div>
                                    <div class="action-content">
                                        <div class="action-title">Clear Data</div>
                                        <div class="action-desc">Remove local storage</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right Column: Recent Activity -->
                    <div class="admin-right-column">
                        <div class="activity-section">
                            <div class="section-title">
                                <i class="fas fa-history"></i>
                                <span>Recent Activity</span>
                            </div>
                            <div class="activity-content">
                                <div class="responses-list" id="recentResponses">
                                    <div class="loading-placeholder">
                                        <i class="fas fa-spinner fa-spin"></i>
                                        <span>Loading responses...</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Insightful Metrics Section -->
                <div class="insights-section">
                    <div class="section-title">
                        <i class="fas fa-chart-pie"></i>
                        <span>Detailed Insights</span>
                    </div>
                    <div id="insightfulMetrics">
                        <div class="loading-placeholder">
                            <i class="fas fa-spinner fa-spin"></i>
                            <span>Loading insights...</span>
                        </div>
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
                background: #f8f9fa;
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
                padding: 2rem 2.5rem;
                background: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                border: 1px solid #e2e8f0;
            }
            
            .admin-header-left h1 {
                color: #2d3748;
                margin: 0 0 0.5rem 0;
                font-size: 2.25rem;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .admin-subtitle {
                color: #718096;
                margin: 0;
                font-size: 1rem;
                font-weight: 500;
                margin-left: 2.5rem;
            }
            
            .admin-header-right {
                display: flex;
                gap: 12px;
            }
            
            .admin-grid {
                display: grid;
                grid-template-columns: 1fr 400px;
                gap: 2rem;
                align-items: start;
            }
            
            .admin-left-column {
                display: flex;
                flex-direction: column;
                gap: 2rem;
            }
            
            .admin-right-column {
                display: flex;
                flex-direction: column;
                gap: 2rem;
            }
            
            .section-title {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1.5rem;
                color: #2d3748;
                font-size: 1.1rem;
                font-weight: 600;
            }
            
            .stats-section, .actions-section, .activity-section, .insights-section {
                background: #ffffff;
                border-radius: 8px;
                padding: 2rem;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                border: 1px solid #e2e8f0;
            }
            
            .insights-section {
                margin-top: 2rem;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1.5rem;
            }
            
            .actions-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 1rem;
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
                display: flex;
                align-items: center;
                padding: 1.5rem;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                background: #ffffff;
            }
            
            .stat-card.primary {
                border-color: #667eea;
                background: #f7fafc;
            }
            
            .stat-card.success {
                border-color: #48bb78;
                background: #f0fff4;
            }
            
            .stat-card.info {
                border-color: #4299e1;
                background: #ebf8ff;
            }
            
            .stat-icon {
                width: 60px;
                height: 60px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 1rem;
                font-size: 1.5rem;
            }
            
            .stat-card.primary .stat-icon {
                background: #667eea;
                color: white;
            }
            
            .stat-card.success .stat-icon {
                background: #48bb78;
                color: white;
            }
            
            .stat-card.info .stat-icon {
                background: #4299e1;
                color: white;
            }
            
            .stat-content {
                flex: 1;
            }
            
            .stat-number {
                font-size: 2.25rem;
                font-weight: 700;
                margin-bottom: 0.25rem;
                line-height: 1;
                color: #2d3748;
            }
            
            .stat-label {
                font-size: 0.9rem;
                font-weight: 500;
                color: #718096;
            }
            
            .action-card {
                display: flex;
                align-items: center;
                padding: 1.25rem;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
                cursor: pointer;
                text-align: left;
                background: #ffffff;
            }
            
            .action-card:hover {
                border-color: #cbd5e0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .action-card.primary:hover {
                border-color: #667eea;
            }
            
            .action-card.secondary:hover {
                border-color: #718096;
            }
            
            .action-card.info:hover {
                border-color: #4299e1;
            }
            
            .action-card.warning:hover {
                border-color: #ed8936;
            }
            
            .action-icon {
                width: 40px;
                height: 40px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 1rem;
                font-size: 1.1rem;
            }
            
            .action-card.primary .action-icon {
                background: #667eea;
                color: white;
            }
            
            .action-card.secondary .action-icon {
                background: #718096;
                color: white;
            }
            
            .action-card.info .action-icon {
                background: #4299e1;
                color: white;
            }
            
            .action-card.warning .action-icon {
                background: #ed8936;
                color: white;
            }
            
            .action-content {
                flex: 1;
            }
            
            .action-title {
                font-size: 0.95rem;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 0.25rem;
            }
            
            .action-desc {
                font-size: 0.8rem;
                color: #718096;
            }
            
            .activity-content {
                min-height: 500px;
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
            

            
            .btn-primary { 
                background: #667eea;
                color: white;
                border: 1px solid #667eea;
            }
            
            .btn-secondary { 
                background: #6c757d;
                color: white;
                border: 1px solid #6c757d;
            }
            
            .btn-info { 
                background: #17a2b8;
                color: white;
                border: 1px solid #17a2b8;
            }
            
            .btn-warning { 
                background: #ffc107;
                color: #212529;
                border: 1px solid #ffc107;
            }
            
            .btn:hover {
                opacity: 0.9;
            }
            
            .responses-list {
                max-height: 400px;
                overflow-y: auto;
                border-radius: 8px;
                padding: 1rem;
                background: #f8f9fa;
                border: 1px solid #e2e8f0;
            }
            
            .response-item {
                padding: 1rem;
                border-bottom: 1px solid #e2e8f0;
                margin-bottom: 1rem;
                border-radius: 8px;
                background: #ffffff;
            }
            
            .response-item:hover {
                background: #f7fafc;
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
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #a0aec0;
                font-style: italic;
                padding: 3rem;
                gap: 1rem;
            }
            
            .loading-placeholder i {
                font-size: 2rem;
                color: #cbd5e0;
            }
            
            /* Insightful Metrics Styles */
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin-top: 1rem;
            }
            
            .metric-card {
                background: #f8f9fa;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 1.5rem;
            }
            
            .metric-header {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 1rem;
                font-weight: 600;
                color: #2d3748;
            }
            
            .metric-header i {
                color: #667eea;
                font-size: 1.1rem;
            }
            
            .metric-content {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .metric-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 0;
                border-bottom: 1px solid #e2e8f0;
            }
            
            .metric-item:last-child {
                border-bottom: none;
            }
            
            .metric-label {
                font-size: 0.9rem;
                color: #4a5568;
            }
            
            .metric-value {
                font-weight: 600;
                color: #2d3748;
                background: #e2e8f0;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.85rem;
            }
            
            /* Enhanced Response Items */
            .response-item.enhanced {
                background: #ffffff;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 1.25rem;
                margin-bottom: 1rem;
            }
            
            .response-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .response-company {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: 600;
                color: #2d3748;
            }
            
            .response-company i {
                color: #667eea;
            }
            
            .response-time {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.85rem;
                color: #718096;
            }
            
            .response-details {
                display: flex;
                flex-wrap: wrap;
                gap: 1rem;
                margin-bottom: 1rem;
            }
            
            .response-detail {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.85rem;
                color: #4a5568;
            }
            
            .response-detail i {
                color: #718096;
                width: 12px;
            }
            
            .response-actions {
                display: flex;
                justify-content: flex-end;
            }
            
            .response-action-btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                font-size: 0.85rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .response-action-btn:hover {
                background: #5a67d8;
            }
            
            /* Response Detail Popup Styles */
            .response-detail-popup {
                max-width: 90%;
                max-height: 85%;
                overflow-y: auto;
                width: 800px;
            }
            
            .response-detail-content {
                padding: 1rem;
            }
            
            .detail-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1rem;
            }
            
            .detail-item {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
            }
            
            .detail-item.full-width {
                grid-column: 1 / -1;
            }
            
            .detail-item label {
                font-weight: 600;
                color: #2d3748;
                font-size: 0.9rem;
            }
            
            .detail-item span {
                color: #4a5568;
                font-size: 0.95rem;
                line-height: 1.4;
            }
            
            .close-btn {
                background: #e53e3e;
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                cursor: pointer;
                font-size: 1.2rem;
                font-weight: bold;
            }
            
            .close-btn:hover {
                background: #c53030;
            }
            
            /* Responses List Popup Styles */
            .responses-list-popup {
                max-width: 95%;
                max-height: 90%;
                overflow-y: auto;
                width: 1000px;
            }
            
            .responses-list-content {
                padding: 1rem;
            }
            
            .responses-table {
                display: flex;
                flex-direction: column;
                gap: 1px;
                background: #e2e8f0;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .table-header {
                display: grid;
                grid-template-columns: 2fr 1.5fr 1fr 1.5fr 1fr;
                background: #4a5568;
                color: white;
                font-weight: 600;
            }
            
            .table-row {
                display: grid;
                grid-template-columns: 2fr 1.5fr 1fr 1.5fr 1fr;
                background: white;
            }
            
            .table-row:hover {
                background: #f7fafc;
            }
            
            .table-cell {
                padding: 1rem;
                display: flex;
                align-items: center;
                font-size: 0.9rem;
            }
            
            .table-action-btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 0.5rem;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.85rem;
            }
            
            .table-action-btn:hover {
                background: #5a67d8;
            }
            
            /* Responsive Design */
            @media (max-width: 1200px) {
                .admin-grid {
                    grid-template-columns: 1fr;
                    gap: 2rem;
                }
                
                .admin-right-column {
                    order: -1;
                }
            }
            
            @media (max-width: 768px) {
                .admin-container {
                    padding: 1rem;
                }
                
                .admin-header {
                    flex-direction: column;
                    gap: 1.5rem;
                    text-align: center;
                    padding: 1.5rem;
                }
                
                .admin-header-left h1 {
                    font-size: 1.75rem;
                }
                
                .admin-subtitle {
                    margin-left: 0;
                    text-align: center;
                }
                
                .stats-grid {
                    grid-template-columns: 1fr;
                }
                
                .actions-grid {
                    grid-template-columns: 1fr;
                }
                
                .stat-card, .action-card {
                    padding: 1.25rem;
                }
                
                .activity-content {
                    min-height: 300px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    async loadAdminData() {
        console.log('Loading admin data...');
        
        // Show loading state
        this.showLoadingState();
        
        try {
            let responses = [];
            
            // Try Firebase first
            if (window.firebaseConfig && window.firebaseConfig.getCollection) {
                console.log('Attempting Firebase connection...');
                const result = await window.firebaseConfig.getCollection('employer-diagnostics');
                console.log('Firebase result:', result);
                
                if (result && result.success && result.data && result.data.length > 0) {
                    responses = result.data;
                    console.log('Firebase data loaded:', responses.length, 'responses');
                } else {
                    console.log('No Firebase data found, trying localStorage...');
                }
            } else {
                console.log('Firebase not available, using localStorage...');
            }
            
            // Always try localStorage as fallback
            if (responses.length === 0) {
                const localData = JSON.parse(localStorage.getItem('employer-submissions') || '[]');
                responses = localData;
                console.log('Using localStorage data:', responses.length, 'responses');
            }
            
            // Store responses for other methods
            this.currentResponses = responses;
            
            // Update all dashboard components
            this.updateAnalytics(responses);
            this.displayRecentResponses(responses);
            this.updateInsightfulMetrics(responses);
            
            console.log('Admin data loading complete');
            
        } catch (error) {
            console.error('Error loading admin data:', error);
            this.showErrorState();
        }
    }

    updateAnalytics(responses) {
        // Calculate meaningful metrics for talent fair
        const totalEmployers = responses.length;
        const totalPositions = this.calculateTotalPositions(responses);
        const topIndustry = this.getTopIndustry(responses);
        const urgentHiring = this.getUrgentHiring(responses);
        
        // Update display
        document.getElementById('totalEmployers').textContent = totalEmployers;
        document.getElementById('totalPositions').textContent = totalPositions;
        document.getElementById('topIndustry').textContent = topIndustry;
        document.getElementById('urgentHiring').textContent = urgentHiring;
        
        // Add click handlers for detailed popups
        this.addAnalyticsClickHandlers(responses);
        
        // Store responses for other methods
        this.currentResponses = responses;
    }
    
    addAnalyticsClickHandlers(responses) {
        // Make analytics cards clickable
        const totalEmployersCard = document.getElementById('totalEmployers').closest('.stat-card');
        const totalPositionsCard = document.getElementById('totalPositions').closest('.stat-card');
        const topIndustryCard = document.getElementById('topIndustry').closest('.stat-card');
        const urgentHiringCard = document.getElementById('urgentHiring').closest('.stat-card');
        
        if (totalEmployersCard) {
            totalEmployersCard.style.cursor = 'pointer';
            totalEmployersCard.onclick = () => this.showEmployersDetailPopup(responses);
        }
        
        if (totalPositionsCard) {
            totalPositionsCard.style.cursor = 'pointer';
            totalPositionsCard.onclick = () => this.showPositionsDetailPopup(responses);
        }
        
        if (topIndustryCard) {
            topIndustryCard.style.cursor = 'pointer';
            topIndustryCard.onclick = () => this.showIndustryDetailPopup(responses);
        }
        
        if (urgentHiringCard) {
            urgentHiringCard.style.cursor = 'pointer';
            urgentHiringCard.onclick = () => this.showUrgentHiringDetailPopup(responses);
        }
    }
    
    showEmployersDetailPopup(responses) {
        const popup = document.createElement('div');
        popup.className = 'notification-overlay';
        popup.innerHTML = `
            <div class="notification-popup analytics-detail-popup">
                <div class="notification-header">
                    <h2><i class="fas fa-building"></i> Registered Employers Details</h2>
                    <button onclick="this.closest('.notification-overlay').remove()" class="close-btn">×</button>
                </div>
                <div class="analytics-detail-content">
                    <div class="detail-summary">
                        <div class="summary-stat">
                            <span class="stat-label">Total Employers</span>
                            <span class="stat-value">${responses.length}</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">Today's Registrations</span>
                            <span class="stat-value">${this.getTodayResponseCount(responses)}</span>
                        </div>
                    </div>
                    <div class="detail-breakdown">
                        <h3>Recent Employers</h3>
                        <div class="employers-list">
                            ${responses.slice(-10).reverse().map(response => `
                                <div class="employer-item">
                                    <div class="employer-info">
                                        <div class="employer-name">${response.companyName || 'Unknown Company'}</div>
                                        <div class="employer-industry">${response.industry || 'Not specified'}</div>
                                    </div>
                                    <div class="employer-date">${this.getRelativeTime(response.timestamp)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        setTimeout(() => popup.classList.add('show'), 100);
    }
    
    showPositionsDetailPopup(responses) {
        const totalPositions = this.calculateTotalPositions(responses);
        const positionsByCompany = responses.map(response => ({
            company: response.companyName || 'Unknown',
            positions: response.positionsAvailable || response.numberOfPositions || 1,
            jobTitle: response.jobTitle || 'Not specified'
        }));
        
        const popup = document.createElement('div');
        popup.className = 'notification-overlay';
        popup.innerHTML = `
            <div class="notification-popup analytics-detail-popup">
                <div class="notification-header">
                    <h2><i class="fas fa-users"></i> Job Openings Details</h2>
                    <button onclick="this.closest('.notification-overlay').remove()" class="close-btn">×</button>
                </div>
                <div class="analytics-detail-content">
                    <div class="detail-summary">
                        <div class="summary-stat">
                            <span class="stat-label">Total Job Openings</span>
                            <span class="stat-value">${totalPositions}</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">Average per Company</span>
                            <span class="stat-value">${Math.round(totalPositions / responses.length)}</span>
                        </div>
                    </div>
                    <div class="detail-breakdown">
                        <h3>Positions by Company</h3>
                        <div class="positions-list">
                            ${positionsByCompany.map(item => `
                                <div class="position-item">
                                    <div class="position-info">
                                        <div class="position-company">${item.company}</div>
                                        <div class="position-title">${item.jobTitle}</div>
                                    </div>
                                    <div class="position-count">${item.positions} ${item.positions == 1 ? 'position' : 'positions'}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        setTimeout(() => popup.classList.add('show'), 100);
    }
    
    showIndustryDetailPopup(responses) {
        const industryBreakdown = this.getIndustryBreakdown(responses);
        const topIndustry = this.getTopIndustry(responses);
        
        const popup = document.createElement('div');
        popup.className = 'notification-overlay';
        popup.innerHTML = `
            <div class="notification-popup analytics-detail-popup">
                <div class="notification-header">
                    <h2><i class="fas fa-industry"></i> Top Industry Details</h2>
                    <button onclick="this.closest('.notification-overlay').remove()" class="close-btn">×</button>
                </div>
                <div class="analytics-detail-content">
                    <div class="detail-summary">
                        <div class="summary-stat">
                            <span class="stat-label">Leading Industry</span>
                            <span class="stat-value">${topIndustry}</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">Total Industries</span>
                            <span class="stat-value">${industryBreakdown.length}</span>
                        </div>
                    </div>
                    <div class="detail-breakdown">
                        <h3>Industry Breakdown</h3>
                        <div class="industry-list">
                            ${industryBreakdown.map(industry => `
                                <div class="industry-item">
                                    <div class="industry-info">
                                        <div class="industry-name">${industry.name}</div>
                                        <div class="industry-percentage">${((industry.count / responses.length) * 100).toFixed(1)}%</div>
                                    </div>
                                    <div class="industry-count">${industry.count} ${industry.count == 1 ? 'employer' : 'employers'}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        setTimeout(() => popup.classList.add('show'), 100);
    }
    
    showUrgentHiringDetailPopup(responses) {
        const urgentHiring = this.getUrgentHiring(responses);
        const urgentEmployers = responses.filter(response => {
            const startDate = response.startDate;
            const additionalNotes = (response.additionalNotes || '').toLowerCase();
            
            if (startDate) {
                const start = new Date(startDate);
                const now = new Date();
                const diffMonths = (start - now) / (1000 * 60 * 60 * 24 * 30);
                if (diffMonths <= 3) return true;
            }
            
            return additionalNotes.includes('urgent') || 
                   additionalNotes.includes('immediate') ||
                   additionalNotes.includes('asap') ||
                   additionalNotes.includes('soon') ||
                   additionalNotes.includes('quickly');
        });
        
        const popup = document.createElement('div');
        popup.className = 'notification-overlay';
        popup.innerHTML = `
            <div class="notification-popup analytics-detail-popup">
                <div class="notification-header">
                    <h2><i class="fas fa-clock"></i> Urgent Hiring Details</h2>
                    <button onclick="this.closest('.notification-overlay').remove()" class="close-btn">×</button>
                </div>
                <div class="analytics-detail-content">
                    <div class="detail-summary">
                        <div class="summary-stat">
                            <span class="stat-label">Urgent Hiring</span>
                            <span class="stat-value">${urgentHiring}</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">Urgency Rate</span>
                            <span class="stat-value">${((urgentHiring / responses.length) * 100).toFixed(1)}%</span>
                        </div>
                    </div>
                    <div class="detail-breakdown">
                        <h3>Employers with Urgent Needs</h3>
                        <div class="urgent-list">
                            ${urgentEmployers.length > 0 ? urgentEmployers.map(employer => `
                                <div class="urgent-item">
                                    <div class="urgent-info">
                                        <div class="urgent-company">${employer.companyName || 'Unknown'}</div>
                                        <div class="urgent-position">${employer.jobTitle || 'Not specified'}</div>
                                        <div class="urgent-start">${employer.startDate ? 'Start: ' + new Date(employer.startDate).toLocaleDateString() : 'Immediate start needed'}</div>
                                    </div>
                                    <div class="urgent-indicator">
                                        <i class="fas fa-exclamation-triangle"></i>
                                        Urgent
                                    </div>
                                </div>
                            `).join('') : '<div class="no-urgent">No urgent hiring needs at the moment</div>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        setTimeout(() => popup.classList.add('show'), 100);
    }
    
    calculateTotalPositions(responses) {
        // Calculate total job openings from all responses
        return responses.reduce((total, response) => {
            // Check for multiple positions data structure
            if (response.positions && Array.isArray(response.positions)) {
                return total + response.positions.length;
            }
            // Check for single position number from our form
            const positions = response.positionsAvailable || response.numberOfPositions || 1;
            return total + (parseInt(positions) || 1);
        }, 0);
    }

    getTopIndustry(responses) {
        if (responses.length === 0) return '-';
        
        // Count industries
        const industryCount = {};
        responses.forEach(response => {
            const industry = response.industry || 'Other';
            industryCount[industry] = (industryCount[industry] || 0) + 1;
        });
        
        // Find top industry
        const topIndustry = Object.entries(industryCount)
            .sort(([,a], [,b]) => b - a)[0];
        
        return topIndustry ? topIndustry[0] : '-';
    }

    getUrgentHiring(responses) {
        // Count employers with urgent hiring needs (looking for immediate start or less than 3 months)
        return responses.filter(response => {
            const startDate = response.startDate;
            const additionalNotes = (response.additionalNotes || '').toLowerCase();
            
            if (startDate) {
                const start = new Date(startDate);
                const now = new Date();
                const diffMonths = (start - now) / (1000 * 60 * 60 * 24 * 30);
                if (diffMonths <= 3) return true;
            }
            
            // Check for urgent keywords in additional notes and other fields
            return additionalNotes.includes('urgent') || 
                   additionalNotes.includes('immediate') ||
                   additionalNotes.includes('asap') ||
                   additionalNotes.includes('soon') ||
                   additionalNotes.includes('quickly');
        }).length;
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
    
    updateInsightfulMetrics(responses) {
        console.log('Updating insightful metrics with', responses.length, 'responses');
        
        const existingMetrics = document.getElementById('insightfulMetrics');
        if (!existingMetrics) {
            console.log('insightfulMetrics element not found');
            return;
        }
        
        if (responses.length === 0) {
            existingMetrics.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-info-circle"></i>
                    <span>No data available for insights</span>
                </div>
            `;
            return;
        }
        
        // Generate and display metrics
        const metricsHtml = this.generateInsightfulMetrics(responses);
        existingMetrics.innerHTML = metricsHtml;
        console.log('Insightful metrics updated');
    }
    
    generateInsightfulMetrics(responses) {
        const industryStats = this.getIndustryBreakdown(responses);
        const experienceStats = this.getExperienceLevelBreakdown(responses);
        const workModeStats = this.getWorkModeBreakdown(responses);
        const salaryStats = this.getSalaryRangeBreakdown(responses);
        const responseTimeStats = this.getResponseTimeAnalysis(responses);
        
        return `
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-header">
                        <i class="fas fa-industry"></i>
                        <span>Top Industries</span>
                    </div>
                    <div class="metric-content">
                        ${industryStats.slice(0, 3).map(stat => `
                            <div class="metric-item">
                                <span class="metric-label">${stat.name}</span>
                                <span class="metric-value">${stat.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-header">
                        <i class="fas fa-user-graduate"></i>
                        <span>Experience Levels</span>
                    </div>
                    <div class="metric-content">
                        ${experienceStats.slice(0, 3).map(stat => `
                            <div class="metric-item">
                                <span class="metric-label">${stat.name}</span>
                                <span class="metric-value">${stat.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-header">
                        <i class="fas fa-home"></i>
                        <span>Work Modes</span>
                    </div>
                    <div class="metric-content">
                        ${workModeStats.slice(0, 3).map(stat => `
                            <div class="metric-item">
                                <span class="metric-label">${stat.name}</span>
                                <span class="metric-value">${stat.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-header">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>Salary Ranges</span>
                    </div>
                    <div class="metric-content">
                        ${salaryStats.slice(0, 3).map(stat => `
                            <div class="metric-item">
                                <span class="metric-label">${stat.name}</span>
                                <span class="metric-value">${stat.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-header">
                        <i class="fas fa-clock"></i>
                        <span>Response Trends</span>
                    </div>
                    <div class="metric-content">
                        <div class="metric-item">
                            <span class="metric-label">Peak Hour</span>
                            <span class="metric-value">${responseTimeStats.peakHour}:00</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">This Week</span>
                            <span class="metric-value">${responseTimeStats.thisWeek}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Growth</span>
                            <span class="metric-value">${responseTimeStats.growth}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-header">
                        <i class="fas fa-briefcase"></i>
                        <span>Job Types</span>
                    </div>
                    <div class="metric-content">
                        ${this.getJobTypeBreakdown(responses).slice(0, 3).map(stat => `
                            <div class="metric-item">
                                <span class="metric-label">${stat.name}</span>
                                <span class="metric-value">${stat.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    getIndustryBreakdown(responses) {
        const breakdown = {};
        responses.forEach(r => {
            const industry = r.industry || 'Not specified';
            breakdown[industry] = (breakdown[industry] || 0) + 1;
        });
        return Object.entries(breakdown)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }
    
    getCompanySizeBreakdown(responses) {
        const breakdown = {};
        responses.forEach(r => {
            const size = r.companySize || 'Not specified';
            breakdown[size] = (breakdown[size] || 0) + 1;
        });
        return Object.entries(breakdown)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }
    
    getExperienceLevelBreakdown(responses) {
        const breakdown = {};
        responses.forEach(r => {
            const level = r.experienceLevel || 'Not specified';
            breakdown[level] = (breakdown[level] || 0) + 1;
        });
        return Object.entries(breakdown)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }
    
    getWorkModeBreakdown(responses) {
        const breakdown = {};
        responses.forEach(r => {
            const mode = r.workMode || 'Not specified';
            breakdown[mode] = (breakdown[mode] || 0) + 1;
        });
        return Object.entries(breakdown)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }
    
    getSalaryRangeBreakdown(responses) {
        const breakdown = {};
        responses.forEach(r => {
            const range = r.salaryRange || 'Not specified';
            breakdown[range] = (breakdown[range] || 0) + 1;
        });
        return Object.entries(breakdown)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }
    
    getJobTypeBreakdown(responses) {
        const breakdown = {};
        responses.forEach(r => {
            const type = r.workType || 'Not specified';
            breakdown[type] = (breakdown[type] || 0) + 1;
        });
        return Object.entries(breakdown)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }
    
    getResponseTimeAnalysis(responses) {
        const hourCounts = {};
        let thisWeekCount = 0;
        let lastWeekCount = 0;
        
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        
        responses.forEach(r => {
            const date = new Date(r.timestamp);
            const hour = date.getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            
            if (date > weekAgo) thisWeekCount++;
            else if (date > twoWeeksAgo) lastWeekCount++;
        });
        
        const peakHour = Object.entries(hourCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 0;
        
        const growth = lastWeekCount > 0 ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100) : 0;
        
        return {
            peakHour,
            thisWeek: thisWeekCount,
            growth: growth > 0 ? `+${growth}` : growth
        };
    }
    
    showLoadingState() {
        console.log('Showing loading state...');
        
        const elements = ['totalResponses', 'todayResponses', 'avgCompletionTime'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = '...';
                console.log('Set loading for', id);
            }
        });
        
        const recentResponses = document.getElementById('recentResponses');
        if (recentResponses) {
            recentResponses.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading responses...</span>
                </div>
            `;
        }
        
        const insightfulMetrics = document.getElementById('insightfulMetrics');
        if (insightfulMetrics) {
            insightfulMetrics.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span>Loading insights...</span>
                </div>
            `;
        }
    }
    
    showErrorState() {
        const elements = ['totalResponses', 'todayResponses', 'avgCompletionTime'];
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '0';
        });
        
        const recentResponses = document.getElementById('recentResponses');
        if (recentResponses) {
            recentResponses.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Error loading data</span>
                </div>
            `;
        }
    }

    displayRecentResponses(responses) {
        const container = document.getElementById('recentResponses');
        
        if (responses.length === 0) {
            container.innerHTML = `
                <div class="loading-placeholder">
                    <i class="fas fa-inbox"></i>
                    <span>No responses yet</span>
                </div>
            `;
            return;
        }
        
        const recent = responses.slice(-10).reverse(); // Last 10 responses
        
        container.innerHTML = recent.map((response, index) => `
            <div class="response-item enhanced">
                <div class="response-header">
                    <div class="response-company">
                        <i class="fas fa-building"></i>
                        <strong>${response.companyName || 'Unknown Company'}</strong>
                    </div>
                    <div class="response-time">
                        <i class="fas fa-clock"></i>
                        ${this.getRelativeTime(response.timestamp)}
                    </div>
                </div>
                <div class="response-details">
                    <div class="response-detail">
                        <i class="fas fa-industry"></i>
                        <span>${response.industry || 'Not specified'}</span>
                    </div>
                    <div class="response-detail">
                        <i class="fas fa-briefcase"></i>
                        <span>${response.jobTitle || 'Not specified'}</span>
                    </div>
                    <div class="response-detail">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>${response.salaryRange || 'Not specified'}</span>
                    </div>
                </div>
                <div class="response-actions">
                    <button class="response-action-btn" onclick="window.simpleFormSubmit.viewSingleResponse(${index})">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    getRelativeTime(timestamp) {
        const now = new Date();
        const date = new Date(timestamp);
        const diff = now - date;
        
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    async exportResponses() {
        console.log('Export button clicked');
        
        // Check if XLSX is loaded
        if (typeof XLSX === 'undefined') {
            alert('Excel library not loaded. Please refresh the page and try again.');
            return;
        }
        
        let responses = this.currentResponses || [];
        
        // If no current responses, try to load from localStorage
        if (responses.length === 0) {
            responses = JSON.parse(localStorage.getItem('employer-submissions') || '[]');
        }
        
        if (responses.length === 0) {
            alert('No responses to export. Please ensure there are survey responses available.');
            return;
        }
        
        try {
            console.log('Starting export with', responses.length, 'responses');
            
            // Show simple loading message
            alert('Preparing Excel export...');
            
            // Create comprehensive Excel data
            const excelData = this.prepareExcelData(responses);
            
            // Export with multiple sheets
            await this.exportToExcelAdvanced(excelData);
            
            alert(`Successfully exported ${responses.length} responses to Excel`);
            console.log('Export completed successfully');
            
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export responses: ' + error.message);
        }
    }
    
    prepareExcelData(responses) {
        // Main responses sheet - map all form fields
        const mainSheet = responses.map((response, index) => ({
            'Response ID': index + 1,
            'Company Name': response.companyName || 'Not provided',
            'Contact Person': response.contactPerson || 'Not provided',
            'Company Website': response.companyWebsite || 'Not provided',
            'Company Location': response.companyLocation || 'Not provided',
            'Industry': response.industry || 'Not specified',
            'Company Description': response.companyDescription || 'Not provided',
            'Job Title': response.jobTitle || 'Not provided',
            'Number of Positions': response.numberOfPositions || 'Not provided',
            'Expected Start Date': response.startDate || 'Not provided',
            'Contract Type': response.contractType || 'Not provided',
            'Job Summary': response.jobSummary || 'Not provided',
            'Key Responsibilities': response.keyResponsibilities || 'Not provided',
            'Preferred Age Range': response.idealAge || 'Not provided',
            'Gender Preference': response.idealGender || 'Not provided',
            'Preferred Location': response.idealLocation || 'Not provided',
            'Experience Level': response.experienceLevel || 'Not provided',
            'Education Level': response.educationLevel || 'Not provided',
            'Technical Skills': response.technicalSkills || 'Not provided',
            'Behavioral Skills': Array.isArray(response.behavioralSkills) ? response.behavioralSkills.join(', ') : (response.behavioralSkills || 'Not provided'),
            'Other Behavioral Skills': response.otherBehavioralSkills || 'Not provided',
            'Work Environment': response.workEnvironment || 'Not provided',
            'Salary Range': response.salaryRange || 'Not provided',
            'Benefits': Array.isArray(response.benefits) ? response.benefits.join(', ') : (response.benefits || 'Not provided'),
            'Other Benefits': response.otherBenefits || 'Not provided',
            'Working Hours': response.workingHours || 'Not provided',
            'Additional Notes': response.additionalNotes || 'Not provided',
            'Submission Date': new Date(response.timestamp).toLocaleDateString(),
            'Submission Time': new Date(response.timestamp).toLocaleTimeString(),
            'Completion Time (minutes)': response.completionTime ? Math.round(response.completionTime / 60000) : 'Not tracked'
        }));
        
        // Analytics summary sheet
        const analyticsSheet = [
            {
                'Metric': 'Total Responses',
                'Value': responses.length,
                'Description': 'Total number of survey responses received'
            },
            {
                'Metric': 'Response Rate Today',
                'Value': this.getTodayResponseCount(responses),
                'Description': 'Responses received today'
            },
            {
                'Metric': 'Average Completion Time',
                'Value': this.getAverageCompletionTime(responses) + ' minutes',
                'Description': 'Average time to complete survey'
            },
            {
                'Metric': 'Most Common Industry',
                'Value': this.getIndustryBreakdown(responses)[0]?.name || 'N/A',
                'Description': 'Most frequently selected industry'
            },
            {
                'Metric': 'Most Common Company Size',
                'Value': this.getCompanySizeBreakdown(responses)[0]?.name || 'N/A',
                'Description': 'Most frequently selected company size'
            },
            {
                'Metric': 'Export Generated',
                'Value': new Date().toLocaleString(),
                'Description': 'Date and time this export was generated'
            }
        ];
        
        // Industry breakdown sheet
        const industrySheet = this.getIndustryBreakdown(responses).map(item => ({
            'Industry': item.name,
            'Count': item.count,
            'Percentage': ((item.count / responses.length) * 100).toFixed(1) + '%'
        }));
        
        // Company size breakdown sheet
        const companySizeSheet = this.getCompanySizeBreakdown(responses).map(item => ({
            'Company Size': item.name,
            'Count': item.count,
            'Percentage': ((item.count / responses.length) * 100).toFixed(1) + '%'
        }));
        
        return {
            'Survey Responses': mainSheet,
            'Analytics Summary': analyticsSheet,
            'Industry Breakdown': industrySheet,
            'Company Size Breakdown': companySizeSheet
        };
    }
    
    async exportToExcelAdvanced(data) {
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Add sheets
        Object.entries(data).forEach(([sheetName, sheetData]) => {
            const ws = XLSX.utils.json_to_sheet(sheetData);
            
            // Auto-size columns
            const range = XLSX.utils.decode_range(ws['!ref']);
            const cols = [];
            for (let C = range.s.c; C <= range.e.c; ++C) {
                let max_width = 0;
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const cell = ws[XLSX.utils.encode_cell({r: R, c: C})];
                    if (cell && cell.v) {
                        const width = cell.v.toString().length;
                        if (width > max_width) max_width = width;
                    }
                }
                cols.push({wch: Math.min(max_width + 2, 50)});
            }
            ws['!cols'] = cols;
            
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });
        
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `BPN-Survey-Export-${timestamp}.xlsx`;
        
        // Save file
        XLSX.writeFile(wb, filename);
    }



    viewSingleResponse(index) {
        const responses = this.currentResponses || [];
        const response = responses[responses.length - 1 - index]; // Adjust for reverse order
        
        if (!response) {
            Utils.showError('Response not found');
            return;
        }
        
        const popup = document.createElement('div');
        popup.className = 'notification-overlay';
        popup.innerHTML = `
            <div class="notification-popup response-detail-popup">
                <div class="notification-header">
                    <h2>Response Details - ${response.companyName || 'Unknown Company'}</h2>
                    <button onclick="this.closest('.notification-overlay').remove()" class="close-btn">×</button>
                </div>
                <div class="response-detail-content">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Company Name:</label>
                            <span>${response.companyName || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Contact Person:</label>
                            <span>${response.contactPerson || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Industry:</label>
                            <span>${response.industry || 'Not specified'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Company Location:</label>
                            <span>${response.companyLocation || 'Not specified'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Website:</label>
                            <span>${response.companyWebsite || 'Not provided'}</span>
                        </div>
                        <div class="detail-item full-width">
                            <label>Company Description:</label>
                            <span>${response.companyDescription || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Job Title:</label>
                            <span>${response.jobTitle || 'Not specified'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Positions Available:</label>
                            <span>${response.positionsAvailable || 'Not specified'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Work Type:</label>
                            <span>${response.workType || 'Not specified'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Work Mode:</label>
                            <span>${response.workMode || 'Not specified'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Expected Start Date:</label>
                            <span>${response.startDate || 'Not specified'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Contract Type:</label>
                            <span>${response.contractType || 'Not specified'}</span>
                        </div>
                        <div class="detail-item full-width">
                            <label>Job Summary:</label>
                            <span>${response.jobSummary || 'Not provided'}</span>
                        </div>
                        <div class="detail-item full-width">
                            <label>Key Responsibilities:</label>
                            <span>${response.keyResponsibilities || 'Not provided'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Experience Level:</label>
                            <span>${response.experienceLevel || 'Not specified'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Technical Skills:</label>
                            <span>${response.technicalSkills || 'Not specified'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Behavioral Skills:</label>
                            <span>${Array.isArray(response.behavioralSkills) ? response.behavioralSkills.join(', ') : (response.behavioralSkills || 'Not specified')}</span>
                        </div>
                        <div class="detail-item">
                            <label>Salary Range:</label>
                            <span>${response.salaryRange || 'Not specified'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Benefits:</label>
                            <span>${Array.isArray(response.benefits) ? response.benefits.join(', ') : (response.benefits || 'Not specified')}</span>
                        </div>
                        <div class="detail-item">
                            <label>Working Hours:</label>
                            <span>${response.workingHours || 'Not specified'}</span>
                        </div>
                        <div class="detail-item full-width">
                            <label>Additional Notes:</label>
                            <span>${response.additionalNotes || 'Not specified'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Submitted:</label>
                            <span>${new Date(response.timestamp).toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Completion Time:</label>
                            <span>${response.completionTime ? Math.round(response.completionTime / 60000) + ' minutes' : 'Not tracked'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.classList.add('show'), 100);
    }
    
    viewResponses() {
        const responses = this.currentResponses || [];
        
        if (responses.length === 0) {
            Utils.showWarning('No responses to view');
            return;
        }
        
        const popup = document.createElement('div');
        popup.className = 'notification-overlay';
        popup.innerHTML = `
            <div class="notification-popup responses-list-popup">
                <div class="notification-header">
                    <h2>All Survey Responses (${responses.length})</h2>
                    <button onclick="this.closest('.notification-overlay').remove()" class="close-btn">×</button>
                </div>
                <div class="responses-list-content">
                    <div class="responses-table">
                        <div class="table-header">
                            <div class="table-cell">Company</div>
                            <div class="table-cell">Industry</div>
                            <div class="table-cell">Job Title</div>
                            <div class="table-cell">Submitted</div>
                            <div class="table-cell">Actions</div>
                        </div>
                        ${responses.map((response, index) => `
                            <div class="table-row">
                                <div class="table-cell">${response.companyName || 'Unknown'}</div>
                                <div class="table-cell">${response.industry || 'Not specified'}</div>
                                <div class="table-cell">${response.jobTitle || 'Not specified'}</div>
                                <div class="table-cell">${new Date(response.timestamp).toLocaleDateString()}</div>
                                <div class="table-cell">
                                    <button class="table-action-btn" onclick="window.simpleFormSubmit.viewSingleResponse(${responses.length - 1 - index})">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(popup);
        setTimeout(() => popup.classList.add('show'), 100);
    }
    
    refreshData() {
        console.log('Refreshing data...');
        this.loadAdminData();
        this.loadFirebaseData();
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
        console.log('Loading Firebase data specifically...');
        try {
            if (!window.firebaseConfig || !window.firebaseConfig.getCollection) {
                console.log('Firebase not initialized');
                return;
            }
            
            const result = await window.firebaseConfig.getCollection('employer-diagnostics');
            console.log('Firebase collection result:', result);
            
            if (result && result.success && result.data && result.data.length > 0) {
                const responses = result.data;
                console.log('Firebase data loaded successfully:', responses.length, 'responses');
                
                // Update current responses
                this.currentResponses = responses;
                
                // Update all dashboard components
                this.updateAnalytics(responses);
                this.displayRecentResponses(responses);
                this.updateInsightfulMetrics(responses);
                
                Utils.showSuccess('Firebase data loaded');
            } else {
                console.log('No Firebase data found');
            }
        } catch (error) {
            console.error('Firebase data error:', error);
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
        const positionsInput = document.getElementById('positionsAvailable');
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextSection());
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prevSection());
        }
        
        // Setup dynamic positions functionality
        if (positionsInput) {
            positionsInput.addEventListener('input', (e) => {
                this.handlePositionsChange(e.target.value);
            });
        }
        
        // Initialize form state
        this.currentSection = 1;
        this.totalSections = document.querySelectorAll('.survey-section').length;
        this.updateProgress();
        this.updateNavigation();
        
        // Initialize positions system
        this.initializePositionsSystem();
    }
    
    initializePositionsSystem() {
        this.positions = []; // Array to store position data
        this.currentPositionMode = 'single'; // 'single' or 'multiple'
    }
    
    handlePositionsChange(value) {
        const numPositions = parseInt(value) || 1;
        
        if (numPositions === 1) {
            this.showSinglePositionMode();
        } else if (numPositions > 1) {
            this.showMultiplePositionsMode(numPositions);
        }
    }
    
    showSinglePositionMode() {
        // Section 2 - Position Details
        const singleMode = document.getElementById('singlePositionMode');
        const multipleMode = document.getElementById('multiplePositionsMode');
        
        // Section 3 - Candidate Profile
        const singlePositionCandidate = document.getElementById('singlePositionCandidate');
        const multiplePositionsCandidate = document.getElementById('multiplePositionsCandidate');
        
        // Section 4 - What You Offer
        const singlePositionOffer = document.getElementById('singlePositionOffer');
        const multiplePositionsOffer = document.getElementById('multiplePositionsOffer');
        
        // Show single position mode
        if (singleMode) singleMode.style.display = 'block';
        if (multipleMode) multipleMode.style.display = 'none';
        
        if (singlePositionCandidate) singlePositionCandidate.style.display = 'block';
        if (multiplePositionsCandidate) multiplePositionsCandidate.style.display = 'none';
        
        if (singlePositionOffer) singlePositionOffer.style.display = 'block';
        if (multiplePositionsOffer) multiplePositionsOffer.style.display = 'none';
        
        this.currentPositionMode = 'single';
    }
    
    showMultiplePositionsMode(numPositions) {
        // Section 2 - Position Details
        const singleMode = document.getElementById('singlePositionMode');
        const multipleMode = document.getElementById('multiplePositionsMode');
        const positionCountSpan = document.getElementById('positionCount');
        
        // Section 3 - Candidate Profile
        const singlePositionCandidate = document.getElementById('singlePositionCandidate');
        const multiplePositionsCandidate = document.getElementById('multiplePositionsCandidate');
        
        // Section 4 - What You Offer
        const singlePositionOffer = document.getElementById('singlePositionOffer');
        const multiplePositionsOffer = document.getElementById('multiplePositionsOffer');
        
        // Show multiple positions mode
        if (singleMode) singleMode.style.display = 'none';
        if (multipleMode) multipleMode.style.display = 'block';
        if (positionCountSpan) positionCountSpan.textContent = numPositions;
        
        if (singlePositionCandidate) singlePositionCandidate.style.display = 'none';
        if (multiplePositionsCandidate) multiplePositionsCandidate.style.display = 'block';
        
        if (singlePositionOffer) singlePositionOffer.style.display = 'none';
        if (multiplePositionsOffer) multiplePositionsOffer.style.display = 'block';
        
        this.currentPositionMode = 'multiple';
        this.createPositionCards(numPositions);
    }
    
    createPositionCards(numPositions) {
        const grid = document.getElementById('positionsGrid');
        if (!grid) return;
        
        // Clear existing cards
        grid.innerHTML = '';
        
        // Initialize positions array
        this.positions = Array.from({ length: numPositions }, (_, i) => ({
            id: i + 1,
            jobTitle: '',
            workType: '',
            workMode: '',
            startDate: '',
            contractType: '',
            jobSummary: '',
            keyResponsibilities: '',
            experienceLevel: '',
            educationLevel: '',
            technicalSkills: '',
            salaryRange: '',
            benefits: [],
            otherBenefits: '',
            workingHours: '',
            additionalNotes: ''
        }));
        
        // Create cards for each position
        for (let i = 0; i < numPositions; i++) {
            const card = this.createPositionCard(i + 1);
            grid.appendChild(card);
        }
    }
    
    createPositionCard(positionNumber) {
        const card = document.createElement('div');
        card.className = 'position-card';
        card.id = `position-card-${positionNumber}`;
        
        card.innerHTML = `
            <div class="position-card-header">
                <div class="position-card-title">
                    <i class="fas fa-briefcase"></i>
                    Position ${positionNumber}
                </div>
                ${positionNumber > 1 ? `
                    <button type="button" class="copy-position-btn" onclick="window.simpleFormSubmit.copyFromPosition1(${positionNumber})">
                        <i class="fas fa-copy"></i>
                        Copy from Position 1
                    </button>
                ` : ''}
            </div>
            
            <div class="position-form-group">
                <label for="pos${positionNumber}_jobTitle">Job Title *</label>
                <input type="text" id="pos${positionNumber}_jobTitle" name="pos${positionNumber}_jobTitle" required>
            </div>
            
            <div class="position-form-group">
                <label>Work Type *</label>
                <div class="position-checkbox-group">
                    <label class="position-checkbox-label">
                        <input type="radio" name="pos${positionNumber}_workType" value="full-time" required>
                        <span>Full-time</span>
                    </label>
                    <label class="position-checkbox-label">
                        <input type="radio" name="pos${positionNumber}_workType" value="part-time" required>
                        <span>Part-time</span>
                    </label>
                    <label class="position-checkbox-label">
                        <input type="radio" name="pos${positionNumber}_workType" value="internship" required>
                        <span>Internship</span>
                    </label>
                </div>
            </div>
            
            <div class="position-form-group">
                <label>Work Mode *</label>
                <div class="position-checkbox-group">
                    <label class="position-checkbox-label">
                        <input type="radio" name="pos${positionNumber}_workMode" value="onsite" required>
                        <span>Onsite</span>
                    </label>
                    <label class="position-checkbox-label">
                        <input type="radio" name="pos${positionNumber}_workMode" value="remote" required>
                        <span>Remote</span>
                    </label>
                    <label class="position-checkbox-label">
                        <input type="radio" name="pos${positionNumber}_workMode" value="hybrid" required>
                        <span>Hybrid</span>
                    </label>
                </div>
            </div>
            
            <div class="position-form-group">
                <label for="pos${positionNumber}_startDate">Expected Start Date *</label>
                <input type="date" id="pos${positionNumber}_startDate" name="pos${positionNumber}_startDate" required>
            </div>
            
            <div class="position-form-group">
                <label>Contract Type *</label>
                <div class="position-checkbox-group">
                    <label class="position-checkbox-label">
                        <input type="radio" name="pos${positionNumber}_contractType" value="permanent" required>
                        <span>Permanent</span>
                    </label>
                    <label class="position-checkbox-label">
                        <input type="radio" name="pos${positionNumber}_contractType" value="fixed-term" required>
                        <span>Fixed-Term</span>
                    </label>
                    <label class="position-checkbox-label">
                        <input type="radio" name="pos${positionNumber}_contractType" value="casual" required>
                        <span>Casual</span>
                    </label>
                </div>
            </div>
            
            <div class="position-form-group">
                <label for="pos${positionNumber}_jobSummary">Job Summary *</label>
                <textarea id="pos${positionNumber}_jobSummary" name="pos${positionNumber}_jobSummary" rows="3" placeholder="Brief description of the role's purpose (2-3 lines)" required></textarea>
            </div>
            
            <div class="position-form-group">
                <label for="pos${positionNumber}_keyResponsibilities">Key Responsibilities *</label>
                <textarea id="pos${positionNumber}_keyResponsibilities" name="pos${positionNumber}_keyResponsibilities" rows="4" placeholder="List 4-6 main tasks and responsibilities for this role..." required></textarea>
            </div>
            
            <div class="position-form-group">
                <label>Experience Level Required *</label>
                <div class="position-checkbox-group">
                    <label class="position-checkbox-label">
                        <input type="radio" name="pos${positionNumber}_experienceLevel" value="trainee" required>
                        <span>Trainee</span>
                    </label>
                    <label class="position-checkbox-label">
                        <input type="radio" name="pos${positionNumber}_experienceLevel" value="entry-level" required>
                        <span>Entry-Level</span>
                    </label>
                    <label class="position-checkbox-label">
                        <input type="radio" name="pos${positionNumber}_experienceLevel" value="mid-career" required>
                        <span>Mid-Career</span>
                    </label>
                    <label class="position-checkbox-label">
                        <input type="radio" name="pos${positionNumber}_experienceLevel" value="senior-level" required>
                        <span>Senior-Level</span>
                    </label>
                </div>
            </div>
            
            <div class="position-form-group">
                <label for="pos${positionNumber}_educationLevel">Education Level Required</label>
                <input type="text" id="pos${positionNumber}_educationLevel" name="pos${positionNumber}_educationLevel" placeholder="e.g., High School, Certificate, Degree">
            </div>
            
            <div class="position-form-group">
                <label for="pos${positionNumber}_technicalSkills">Technical/Professional Skills Needed</label>
                <textarea id="pos${positionNumber}_technicalSkills" name="pos${positionNumber}_technicalSkills" rows="3" placeholder="List required software, certificates, specific skills..."></textarea>
            </div>
            
            <div class="position-form-group">
                <label for="pos${positionNumber}_salaryRange">Salary Range (Monthly) *</label>
                <input type="text" id="pos${positionNumber}_salaryRange" name="pos${positionNumber}_salaryRange" placeholder="e.g., RWF 250,000 - 350,000" required>
            </div>
            
            <div class="position-form-group">
                <label>Benefits/Perks (Select all that apply)</label>
                <div class="position-benefits-grid">
                    <label class="position-checkbox-label">
                        <input type="checkbox" name="pos${positionNumber}_benefits" value="transport-allowance">
                        <span>Transport allowance</span>
                    </label>
                    <label class="position-checkbox-label">
                        <input type="checkbox" name="pos${positionNumber}_benefits" value="meals-lunch">
                        <span>Meals/Lunch</span>
                    </label>
                    <label class="position-checkbox-label">
                        <input type="checkbox" name="pos${positionNumber}_benefits" value="health-insurance">
                        <span>Health insurance</span>
                    </label>
                    <label class="position-checkbox-label">
                        <input type="checkbox" name="pos${positionNumber}_benefits" value="training-development">
                        <span>Training/Development</span>
                    </label>
                    <label class="position-checkbox-label">
                        <input type="checkbox" name="pos${positionNumber}_benefits" value="commission-bonuses">
                        <span>Commission or Bonuses</span>
                    </label>
                    <label class="position-checkbox-label">
                        <input type="checkbox" name="pos${positionNumber}_benefits" value="flexible-schedule">
                        <span>Flexible schedule</span>
                    </label>
                </div>
            </div>
            
            <div class="position-form-group">
                <label for="pos${positionNumber}_otherBenefits">Other benefits/perks</label>
                <input type="text" id="pos${positionNumber}_otherBenefits" name="pos${positionNumber}_otherBenefits" placeholder="Please specify any other benefits">
            </div>
            
            <div class="position-form-group">
                <label for="pos${positionNumber}_workingHours">Working Hours *</label>
                <input type="text" id="pos${positionNumber}_workingHours" name="pos${positionNumber}_workingHours" placeholder="e.g., 9am–5pm, Shift work" required>
            </div>
            
            <div class="position-form-group">
                <label for="pos${positionNumber}_additionalNotes">Additional Notes (Optional)</label>
                <textarea id="pos${positionNumber}_additionalNotes" name="pos${positionNumber}_additionalNotes" rows="3" placeholder="Any extra info you'd like to share about this position?"></textarea>
            </div>
        `;
        
        return card;
    }
    
    copyFromPosition1(targetPosition) {
        const pos1Data = this.getPositionData(1);
        if (!pos1Data) return;
        
        // Copy data to target position
        this.setPositionData(targetPosition, pos1Data);
        
        // Show success message
        const card = document.getElementById(`position-card-${targetPosition}`);
        if (card) {
            const title = card.querySelector('.position-card-title');
            const originalText = title.innerHTML;
            title.innerHTML = '<i class="fas fa-check"></i> Copied from Position 1';
            title.style.color = '#10b981';
            
            setTimeout(() => {
                title.innerHTML = originalText;
                title.style.color = '';
            }, 2000);
        }
    }
    
    getPositionData(positionNumber) {
        const data = {};
        
        // Get text inputs
        const textFields = ['jobTitle', 'startDate', 'jobSummary', 'keyResponsibilities', 'educationLevel', 'technicalSkills', 'salaryRange', 'otherBenefits', 'workingHours', 'additionalNotes'];
        textFields.forEach(field => {
            const element = document.getElementById(`pos${positionNumber}_${field}`);
            if (element) data[field] = element.value;
        });
        
        // Get radio buttons
        const radioFields = ['workType', 'workMode', 'contractType', 'experienceLevel'];
        radioFields.forEach(field => {
            const checked = document.querySelector(`input[name="pos${positionNumber}_${field}"]:checked`);
            if (checked) data[field] = checked.value;
        });
        
        // Get checkboxes
        const benefitsChecked = document.querySelectorAll(`input[name="pos${positionNumber}_benefits"]:checked`);
        data.benefits = Array.from(benefitsChecked).map(cb => cb.value);
        
        return data;
    }
    
    setPositionData(positionNumber, data) {
        // Set text inputs
        const textFields = ['jobTitle', 'startDate', 'jobSummary', 'keyResponsibilities', 'educationLevel', 'technicalSkills', 'salaryRange', 'otherBenefits', 'workingHours', 'additionalNotes'];
        textFields.forEach(field => {
            const element = document.getElementById(`pos${positionNumber}_${field}`);
            if (element && data[field]) element.value = data[field];
        });
        
        // Set radio buttons
        const radioFields = ['workType', 'workMode', 'contractType', 'experienceLevel'];
        radioFields.forEach(field => {
            if (data[field]) {
                const radio = document.querySelector(`input[name="pos${positionNumber}_${field}"][value="${data[field]}"]`);
                if (radio) radio.checked = true;
            }
        });
        
        // Set checkboxes
        if (data.benefits && data.benefits.length > 0) {
            data.benefits.forEach(benefit => {
                const checkbox = document.querySelector(`input[name="pos${positionNumber}_benefits"][value="${benefit}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
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
        
        // Handle dynamic positions data
        this.processPositionsData(data);
        
        return data;
    }
    
    processPositionsData(data) {
        // Check if we have multiple positions mode
        if (this.currentPositionMode === 'multiple') {
            const positionsGrid = document.getElementById('positionsGrid');
            if (positionsGrid) {
                const positionCards = positionsGrid.querySelectorAll('.position-card');
                data.positions = [];
                
                positionCards.forEach((card, index) => {
                    const positionNumber = index + 1;
                    const positionData = this.getPositionData(positionNumber);
                    
                    if (positionData.jobTitle) { // Only add if position has a job title
                        data.positions.push({
                            positionNumber: positionNumber,
                            ...positionData
                        });
                    }
                });
                
                // Calculate total positions
                data.totalPositions = data.positions.length;
            }
        } else {
            // Single position mode - collect position data from regular form fields
            const singlePositionData = this.collectSinglePositionData(data);
            if (singlePositionData.jobTitle) {
                data.positions = [singlePositionData];
                data.totalPositions = 1;
            }
        }
    }
    
    collectSinglePositionData(data) {
        // Map single position fields to position structure
        return {
            positionNumber: 1,
            jobTitle: data.jobTitle || '',
            workType: data.workType || '',
            workMode: data.workMode || '',
            startDate: data.startDate || '',
            contractType: data.contractType || '',
            jobSummary: data.jobSummary || '',
            keyResponsibilities: data.keyResponsibilities || '',
            experienceLevel: data.experienceLevel || '',
            educationLevel: data.educationLevel || '',
            technicalSkills: data.technicalSkills || '',
            salaryRange: data.salaryRange || '',
            benefits: data.benefits || [],
            otherBenefits: data.otherBenefits || '',
            workingHours: data.workingHours || '',
            additionalNotes: data.additionalNotes || ''
        };
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