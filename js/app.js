// Main Application Controller
class SurveyApp {
    constructor() {
        this.currentView = 'survey';
        this.currentAdminView = 'dashboard';
        this.isAdminMode = false;
        this.longPressTimer = null;
        this.longPressDuration = 5000; // 5 seconds
        
        this.surveys = [];
        this.responses = [];
        this.currentSurvey = null;
        this.currentSurveyId = null;
        
        this.init();
    }
    
    async init() {
        this.bindEvents();
        this.loadInitialData();
        this.checkUrlParams();
    }
    
    bindEvents() {
        // Logo long press for admin access
        const logoContainer = document.getElementById('logoContainer');
        if (logoContainer) {
            logoContainer.addEventListener('mousedown', this.startLongPress.bind(this));
            logoContainer.addEventListener('mouseup', this.endLongPress.bind(this));
            logoContainer.addEventListener('mouseleave', this.endLongPress.bind(this));
            logoContainer.addEventListener('touchstart', this.startLongPress.bind(this));
            logoContainer.addEventListener('touchend', this.endLongPress.bind(this));
        }
        
        // Admin login form
        const adminLoginForm = document.getElementById('adminLoginForm');
        if (adminLoginForm) {
            adminLoginForm.addEventListener('submit', this.handleAdminLogin.bind(this));
        }

        // Admin signup form
        const adminSignupForm = document.getElementById('adminSignupForm');
        if (adminSignupForm) {
            adminSignupForm.addEventListener('submit', this.handleAdminSignup.bind(this));
        }

        // Auth toggle buttons
        const showSignupBtn = document.getElementById('showSignupBtn');
        const showLoginBtn = document.getElementById('showLoginBtn');
        if (showSignupBtn) {
            showSignupBtn.addEventListener('click', this.showSignupForm.bind(this));
        }
        if (showLoginBtn) {
            showLoginBtn.addEventListener('click', this.showLoginForm.bind(this));
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }
        
        // Admin navigation
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', this.handleAdminNavigation.bind(this));
        });
        
        // Modal close
        const closeModal = document.getElementById('closeQuestionModal');
        if (closeModal) {
            closeModal.addEventListener('click', () => Utils.hideModal());
        }
        
        // Modal overlay click to close
        const modalOverlay = document.getElementById('modalOverlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    Utils.hideModal();
                }
            });
        }
        
        // Create survey button
        const createSurveyBtn = document.getElementById('createSurveyBtn');
        if (createSurveyBtn) {
            createSurveyBtn.addEventListener('click', this.createNewSurvey.bind(this));
        }
        
        // Export excel button
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', this.exportResponsesToExcel.bind(this));
        }
        
        // Survey filter
        const surveyFilter = document.getElementById('surveyFilter');
        if (surveyFilter) {
            surveyFilter.addEventListener('change', this.filterResponses.bind(this));
        }
        
        // Analytics filter
        const analyticsFilter = document.getElementById('analyticsFilter');
        if (analyticsFilter) {
            analyticsFilter.addEventListener('change', this.loadAnalytics.bind(this));
        }
    }
    
    checkUrlParams() {
        const params = Utils.getUrlParams();
        if (params.survey) {
            this.currentSurveyId = params.survey;
            this.loadSurveyForRespondent(params.survey);
        }
    }
    
    async loadInitialData() {
        Utils.showLoading('Loading surveys...');
        
        try {
            // Try to load surveys from Firebase
            const surveysResult = await window.firebaseConfig.getCollection('surveys', 
                { field: 'createdAt', direction: 'desc' });
            
            if (surveysResult.success) {
                this.surveys = surveysResult.data;
                this.updateSurveySelectors();
                
                // If no survey specified in URL, load the first active survey
                if (!this.currentSurveyId && this.surveys.length > 0) {
                    const activeSurvey = this.surveys.find(s => s.status === 'active');
                    if (activeSurvey) {
                        this.currentSurveyId = activeSurvey.id;
                        this.loadSurveyForRespondent(activeSurvey.id);
                    }
                }
            } else {
                // Show no surveys message if no data available
                this.showNoSurveyMessage();
            }
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            Utils.showError('Unable to connect to database. Please check Firebase configuration.');
        } finally {
            Utils.hideLoading();
        }
    }

    loadDemoData() {
        // Demo survey data for when Firebase access is limited
        this.surveys = [
            {
                id: 'demo-customer-satisfaction',
                title: 'Customer Satisfaction Survey',
                description: 'Help us improve our services by sharing your feedback',
                status: 'active',
                questions: [
                    {
                        id: 'q1',
                        type: 'radio',
                        title: 'How satisfied are you with our service?',
                        description: 'Please rate your overall satisfaction',
                        required: true,
                        options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied']
                    },
                    {
                        id: 'q2',
                        type: 'checkbox',
                        title: 'Which features do you use most?',
                        description: 'Select all that apply',
                        required: false,
                        options: ['Mobile App', 'Website', 'Customer Support', 'Email Notifications', 'Reports']
                    },
                    {
                        id: 'q3',
                        type: 'rating',
                        title: 'Rate our customer support',
                        description: 'On a scale of 1-5 stars',
                        required: true,
                        scale: 5
                    },
                    {
                        id: 'q4',
                        type: 'text',
                        title: 'Any additional comments?',
                        description: 'Please share any suggestions or feedback',
                        required: false
                    }
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];

        this.updateSurveySelectors();
        
        // Show demo notice
        const demoNotice = document.createElement('div');
        demoNotice.className = 'message message-info';
        demoNotice.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <strong>Demo Mode:</strong> You're viewing sample survey data. 
            To access full functionality, configure Firebase authentication and database permissions.
        `;
        document.querySelector('.main-content').prepend(demoNotice);
        
        // Load the demo survey
        if (this.surveys.length > 0) {
            this.currentSurveyId = this.surveys[0].id;
            this.loadSurveyForRespondent(this.surveys[0].id);
        }
    }
    
    updateSurveySelectors() {
        // Update survey filter dropdown
        const surveyFilter = document.getElementById('surveyFilter');
        const analyticsFilter = document.getElementById('analyticsFilter');
        
        [surveyFilter, analyticsFilter].forEach(select => {
            if (select) {
                // Clear existing options except the first one
                const firstOption = select.querySelector('option');
                select.innerHTML = '';
                if (firstOption) {
                    select.appendChild(firstOption);
                }
                
                // Add survey options
                this.surveys.forEach(survey => {
                    const option = document.createElement('option');
                    option.value = survey.id;
                    option.textContent = survey.title;
                    select.appendChild(option);
                });
            }
        });
    }
    
    startLongPress(e) {
        e.preventDefault();
        this.longPressTimer = setTimeout(() => {
            this.showAdminLogin();
        }, this.longPressDuration);
    }
    
    endLongPress(e) {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }
    
    async showAdminLogin() {
        this.showView('adminLoginView');
        
        // Check if admin already exists to show/hide signup option
        const adminExists = await window.firebaseConfig.adminExists();
        const showSignupBtn = document.getElementById('showSignupBtn');
        const authToggleText = document.getElementById('authToggleText');
        
        if (adminExists.exists) {
            showSignupBtn.style.display = 'none';
            authToggleText.innerHTML = '<i class="fas fa-info-circle"></i> Admin account exists. Sign in to continue.';
        } else {
            showSignupBtn.style.display = 'inline';
            authToggleText.innerHTML = 'No admin account exists? <a href="#" id="showSignupBtn">Create first admin account</a>';
            // Re-bind event listener for dynamically updated button
            const newShowSignupBtn = document.getElementById('showSignupBtn');
            if (newShowSignupBtn) {
                newShowSignupBtn.addEventListener('click', this.showSignupForm.bind(this));
            }
        }
    }

    showSignupForm(e) {
        e.preventDefault();
        document.getElementById('adminLoginForm').style.display = 'none';
        document.getElementById('adminSignupForm').style.display = 'block';
        document.getElementById('authToggleText').style.display = 'none';
        document.getElementById('authToggleTextSignup').style.display = 'block';
        this.clearAuthError();
    }

    showLoginForm(e) {
        e.preventDefault();
        document.getElementById('adminLoginForm').style.display = 'block';
        document.getElementById('adminSignupForm').style.display = 'none';
        document.getElementById('authToggleText').style.display = 'block';
        document.getElementById('authToggleTextSignup').style.display = 'none';
        this.clearAuthError();
    }

    clearAuthError() {
        const errorEl = document.getElementById('authError');
        if (errorEl) {
            errorEl.textContent = '';
            errorEl.classList.remove('show');
        }
    }

    async handleAdminSignup(e) {
        e.preventDefault();
        
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const errorEl = document.getElementById('authError');
        
        // Validation
        if (!email || !password || !confirmPassword) {
            errorEl.textContent = 'Please fill in all fields';
            errorEl.classList.add('show');
            return;
        }
        
        if (password !== confirmPassword) {
            errorEl.textContent = 'Passwords do not match';
            errorEl.classList.add('show');
            return;
        }
        
        if (password.length < 6) {
            errorEl.textContent = 'Password must be at least 6 characters long';
            errorEl.classList.add('show');
            return;
        }
        
        Utils.showLoading('Creating admin account...');
        
        try {
            const result = await window.firebaseConfig.createAdminAccount(email, password);
            
            if (result.success) {
                this.isAdminMode = true;
                this.showView('adminDashboardView');
                this.loadAdminData();
                Utils.showSuccess('Admin account created successfully! Welcome to the dashboard.');
            } else {
                errorEl.textContent = result.error;
                errorEl.classList.add('show');
            }
        } catch (error) {
            console.error('Signup error:', error);
            errorEl.textContent = 'Failed to create admin account. Please try again.';
            errorEl.classList.add('show');
        } finally {
            Utils.hideLoading();
        }
    }
    
    async handleAdminLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        const errorEl = document.getElementById('authError');
        
        if (!email || !password) {
            errorEl.textContent = 'Please enter both email and password';
            errorEl.classList.add('show');
            return;
        }
        
        Utils.showLoading('Signing in...');
        
        try {
            const result = await window.firebaseConfig.signInWithEmailAndPassword(email, password);
            
            if (result.success) {
                this.isAdminMode = true;
                this.showView('adminDashboardView');
                this.loadAdminData();
                Utils.showSuccess('Welcome to admin dashboard');
            } else {
                errorEl.textContent = result.error;
                errorEl.classList.add('show');
            }
        } catch (error) {
            console.error('Login error:', error);
            errorEl.textContent = 'Authentication failed';
            errorEl.classList.add('show');
        } finally {
            Utils.hideLoading();
        }
    }
    
    async handleLogout() {
        Utils.showLoading('Signing out...');
        
        try {
            await window.firebaseConfig.signOut();
            this.isAdminMode = false;
            this.showView('surveyView');
            Utils.showSuccess('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            Utils.showError('Failed to log out');
        } finally {
            Utils.hideLoading();
        }
    }
    
    handleAuthStateChange(user) {
        if (!user && this.isAdminMode) {
            // User was logged out
            this.isAdminMode = false;
            this.showView('surveyView');
        }
    }
    
    showView(viewId) {
        // Hide all main views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show target view
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.classList.add('active');
        }
        
        this.currentView = viewId;
    }
    
    handleAdminNavigation(e) {
        e.preventDefault();
        
        const link = e.target.closest('.sidebar-link');
        const adminView = link.dataset.adminView;
        
        if (adminView) {
            this.showAdminView(adminView);
            
            // Update active state
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        }
    }
    
    showAdminView(viewId) {
        // Hide all admin views
        document.querySelectorAll('.admin-view').forEach(view => {
            view.classList.remove('active');
        });
        
        // Show target view
        const targetView = document.getElementById(`admin${viewId.charAt(0).toUpperCase() + viewId.slice(1)}`);
        if (targetView) {
            targetView.classList.add('active');
        }
        
        this.currentAdminView = viewId;
        
        // Load view-specific data
        this.loadAdminViewData(viewId);
    }
    
    async loadAdminData() {
        if (!this.isAdminMode) return;
        
        try {
            // Load responses
            const responsesResult = await window.firebaseConfig.getCollection('responses', 
                { field: 'submittedAt', direction: 'desc' });
            
            if (responsesResult.success) {
                this.responses = responsesResult.data;
            }
            
            // Update dashboard stats
            this.updateDashboardStats();
            
            // Load view-specific data
            this.loadAdminViewData(this.currentAdminView);
            
        } catch (error) {
            console.error('Error loading admin data:', error);
            Utils.showError('Failed to load admin data');
        }
    }
    
    loadAdminViewData(viewId) {
        switch (viewId) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'surveys':
                this.loadSurveysView();
                break;
            case 'form-builder':
                // Form builder is handled separately
                break;
            case 'responses':
                this.loadResponsesView();
                break;
            case 'analytics':
                this.loadAnalyticsView();
                break;
        }
    }
    
    updateDashboardStats() {
        const totalSurveys = this.surveys.length;
        const totalResponses = this.responses.length;
        
        // Today's responses
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayResponses = this.responses.filter(r => {
            const responseDate = r.submittedAt.toDate();
            return responseDate >= today;
        }).length;
        
        // Completion rate (completed vs started)
        const completedResponses = this.responses.filter(r => r.status === 'completed').length;
        const completionRate = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;
        
        // Update UI
        document.getElementById('totalSurveys').textContent = totalSurveys;
        document.getElementById('totalResponses').textContent = totalResponses;
        document.getElementById('todayResponses').textContent = todayResponses;
        document.getElementById('completionRate').textContent = `${completionRate}%`;
    }
    
    loadDashboard() {
        this.loadResponseTrendChart();
    }
    
    loadResponseTrendChart() {
        const ctx = document.getElementById('responseTrendChart');
        if (!ctx) return;
        
        // Group responses by date
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }
        
        const responsesByDate = {};
        last7Days.forEach(date => responsesByDate[date] = 0);
        
        this.responses.forEach(response => {
            const date = response.submittedAt.toDate().toISOString().split('T')[0];
            if (responsesByDate.hasOwnProperty(date)) {
                responsesByDate[date]++;
            }
        });
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days.map(date => new Date(date).toLocaleDateString()),
                datasets: [{
                    label: 'Responses',
                    data: last7Days.map(date => responsesByDate[date]),
                    borderColor: '#2DD4BF',
                    backgroundColor: 'rgba(45, 212, 191, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
    
    loadSurveysView() {
        const surveysList = document.getElementById('surveysList');
        if (!surveysList) return;
        
        if (this.surveys.length === 0) {
            surveysList.innerHTML = `
                <div class="text-center" style="padding: 3rem;">
                    <i class="fas fa-poll" style="font-size: 3rem; color: var(--color-primary); margin-bottom: 1rem;"></i>
                    <h3>No Surveys Yet</h3>
                    <p>Create your first survey to get started</p>
                    <button class="btn btn-primary" onclick="app.createNewSurvey()">
                        <i class="fas fa-plus"></i> Create Survey
                    </button>
                </div>
            `;
            return;
        }
        
        const surveysHtml = this.surveys.map(survey => {
            const responseCount = this.responses.filter(r => r.surveyId === survey.id).length;
            const statusClass = survey.status || 'draft';
            
            return `
                <div class="survey-item">
                    <div class="survey-item-header">
                        <div>
                            <div class="survey-item-title">${Utils.sanitizeHtml(survey.title)}</div>
                            <div class="survey-item-description">${Utils.sanitizeHtml(survey.description || '')}</div>
                        </div>
                        <div class="survey-item-actions">
                            <button class="btn btn-sm btn-outline" onclick="app.editSurvey('${survey.id}')">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="app.copySurveyLink('${survey.id}')">
                                <i class="fas fa-link"></i> Copy Link
                            </button>
                            <button class="btn btn-sm btn-outline" onclick="app.deleteSurvey('${survey.id}')">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                    
                    <div class="survey-item-meta">
                        <div class="meta-item">
                            <div class="meta-value">${responseCount}</div>
                            <div class="meta-label">Responses</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-value">${survey.questions ? survey.questions.length : 0}</div>
                            <div class="meta-label">Questions</div>
                        </div>
                        <div class="meta-item">
                            <div class="meta-value">${Utils.formatDate(survey.createdAt, 'short')}</div>
                            <div class="meta-label">Created</div>
                        </div>
                        <div class="meta-item">
                            <span class="survey-status ${statusClass}">${statusClass.charAt(0).toUpperCase() + statusClass.slice(1)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        surveysList.innerHTML = surveysHtml;
    }
    
    loadResponsesView() {
        const responsesTableBody = document.getElementById('responsesTableBody');
        if (!responsesTableBody) return;
        
        const filteredResponses = this.getFilteredResponses();
        
        if (filteredResponses.length === 0) {
            responsesTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="padding: 2rem;">
                        <i class="fas fa-inbox" style="font-size: 2rem; color: var(--color-tertiary); margin-bottom: 1rem;"></i>
                        <br>No responses found
                    </td>
                </tr>
            `;
            return;
        }
        
        const responsesHtml = filteredResponses.map(response => {
            const survey = this.surveys.find(s => s.id === response.surveyId);
            const surveyTitle = survey ? survey.title : 'Unknown Survey';
            
            return `
                <tr>
                    <td>${response.id.substring(0, 8)}...</td>
                    <td>${Utils.sanitizeHtml(surveyTitle)}</td>
                    <td>${Utils.formatDate(response.submittedAt, 'datetime')}</td>
                    <td>${Utils.sanitizeHtml(response.deviceInfo?.device || 'Unknown')}</td>
                    <td><span class="response-status ${response.status}">${response.status}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="app.viewResponse('${response.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        responsesTableBody.innerHTML = responsesHtml;
    }
    
    getFilteredResponses() {
        const filter = document.getElementById('surveyFilter')?.value;
        if (!filter) return this.responses;
        
        return this.responses.filter(response => response.surveyId === filter);
    }
    
    loadAnalyticsView() {
        const filter = document.getElementById('analyticsFilter')?.value;
        const analyticsContent = document.getElementById('analyticsContent');
        
        if (!filter || !analyticsContent) {
            analyticsContent.innerHTML = `
                <div class="analytics-empty">
                    <i class="fas fa-chart-bar"></i>
                    <p>Select a survey to view analytics</p>
                </div>
            `;
            return;
        }
        
        // Load analytics for selected survey
        window.analytics.loadSurveyAnalytics(filter);
    }
    
    async createNewSurvey() {
        this.showAdminView('form-builder');
        
        // Reset form builder
        if (window.formBuilder) {
            window.formBuilder.reset();
        }
    }
    
    async editSurvey(surveyId) {
        const survey = this.surveys.find(s => s.id === surveyId);
        if (!survey) return;
        
        this.showAdminView('form-builder');
        
        // Load survey in form builder
        if (window.formBuilder) {
            window.formBuilder.loadSurvey(survey);
        }
    }
    
    async copySurveyLink(surveyId) {
        const baseUrl = window.location.origin + window.location.pathname;
        const surveyUrl = `${baseUrl}?survey=${surveyId}`;
        
        const success = await Utils.copyToClipboard(surveyUrl);
        if (success) {
            Utils.showSuccess('Survey link copied to clipboard');
        } else {
            Utils.showError('Failed to copy link');
        }
    }
    
    async deleteSurvey(surveyId) {
        if (!confirm('Are you sure you want to delete this survey? This action cannot be undone.')) {
            return;
        }
        
        Utils.showLoading('Deleting survey...');
        
        try {
            const result = await window.firebaseConfig.deleteDocument('surveys', surveyId);
            
            if (result.success) {
                // Remove from local array
                this.surveys = this.surveys.filter(s => s.id !== surveyId);
                this.loadSurveysView();
                this.updateSurveySelectors();
                Utils.showSuccess('Survey deleted successfully');
            } else {
                Utils.showError('Failed to delete survey');
            }
        } catch (error) {
            console.error('Error deleting survey:', error);
            Utils.showError('Failed to delete survey');
        } finally {
            Utils.hideLoading();
        }
    }
    
    async exportResponsesToExcel() {
        const filteredResponses = this.getFilteredResponses();
        
        if (filteredResponses.length === 0) {
            Utils.showWarning('No responses to export');
            return;
        }
        
        Utils.showLoading('Preparing export...');
        
        try {
            // Prepare data for export
            const exportData = filteredResponses.map(response => {
                const survey = this.surveys.find(s => s.id === response.surveyId);
                const flatData = {
                    'Response ID': response.id,
                    'Survey': survey ? survey.title : 'Unknown',
                    'Submitted At': Utils.formatDate(response.submittedAt, 'datetime'),
                    'Device': response.deviceInfo?.device || 'Unknown',
                    'Status': response.status
                };
                
                // Add response data
                if (response.responses) {
                    Object.keys(response.responses).forEach(key => {
                        const value = response.responses[key];
                        flatData[key] = Array.isArray(value) ? value.join(', ') : value;
                    });
                }
                
                return flatData;
            });
            
            // Generate filename
            const timestamp = new Date().toISOString().split('T')[0];
            const filename = `survey_responses_${timestamp}.xlsx`;
            
            // Export to Excel
            const result = Utils.exportToExcel(exportData, filename);
            
            if (result.success) {
                Utils.showSuccess('Responses exported successfully');
            } else {
                Utils.showError('Failed to export responses');
            }
        } catch (error) {
            console.error('Error exporting responses:', error);
            Utils.showError('Failed to export responses');
        } finally {
            Utils.hideLoading();
        }
    }
    
    filterResponses() {
        this.loadResponsesView();
    }
    
    loadAnalytics() {
        this.loadAnalyticsView();
    }
    
    async loadSurveyForRespondent(surveyId) {
        Utils.showLoading('Loading survey...');
        
        try {
            // Try to load from Firebase first
            let surveyData = null;
            
            if (window.firebaseConfig && window.firebaseConfig.db) {
                const result = await window.firebaseConfig.getDocument('surveys', surveyId);
                if (result.success && result.data.status === 'active') {
                    surveyData = result.data;
                }
            }
            
            // Fallback to demo data if Firebase fails
            if (!surveyData) {
                surveyData = this.surveys.find(s => s.id === surveyId);
            }
            
            if (surveyData && surveyData.status === 'active') {
                this.currentSurvey = surveyData;
                
                // Load survey in respondent interface
                if (window.survey) {
                    window.survey.loadSurvey(this.currentSurvey);
                } else {
                    // Initialize survey interface if not available
                    setTimeout(() => {
                        if (window.survey) {
                            window.survey.loadSurvey(this.currentSurvey);
                        }
                    }, 100);
                }
            } else {
                this.showNoSurveyMessage();
            }
        } catch (error) {
            console.error('Error loading survey:', error);
            this.showNoSurveyMessage();
        } finally {
            Utils.hideLoading();
        }
    }
    
    showNoSurveyMessage() {
        const surveyForm = document.getElementById('surveyForm');
        if (surveyForm) {
            surveyForm.innerHTML = `
                <div class="survey-welcome">
                    <div class="welcome-icon">
                        <i class="fas fa-clipboard-list"></i>
                    </div>
                    <h2>Survey Not Available</h2>
                    <p>The requested survey is not currently available or has been closed.</p>
                </div>
            `;
        }
    }
    
    async viewResponse(responseId) {
        const response = this.responses.find(r => r.id === responseId);
        if (!response) return;
        
        const survey = this.surveys.find(s => s.id === response.surveyId);
        
        let modalContent = `
            <div class="response-details">
                <h4>Response Details</h4>
                <div class="response-meta">
                    <p><strong>Survey:</strong> ${survey ? Utils.sanitizeHtml(survey.title) : 'Unknown'}</p>
                    <p><strong>Submitted:</strong> ${Utils.formatDate(response.submittedAt, 'datetime')}</p>
                    <p><strong>Device:</strong> ${Utils.sanitizeHtml(response.deviceInfo?.device || 'Unknown')}</p>
                    <p><strong>Status:</strong> ${response.status}</p>
                </div>
                <hr>
                <h4>Responses</h4>
                <div class="response-answers">
        `;
        
        if (response.responses && survey && survey.questions) {
            survey.questions.forEach(question => {
                const answer = response.responses[question.id];
                if (answer !== undefined && answer !== null && answer !== '') {
                    modalContent += `
                        <div class="answer-item">
                            <strong>${Utils.sanitizeHtml(question.title)}</strong><br>
                            <span>${Array.isArray(answer) ? answer.join(', ') : Utils.sanitizeHtml(answer.toString())}</span>
                        </div>
                    `;
                }
            });
        }
        
        modalContent += `
                </div>
            </div>
        `;
        
        document.getElementById('questionModalTitle').textContent = 'View Response';
        document.getElementById('questionModalContent').innerHTML = modalContent;
        Utils.showModal('questionModal');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SurveyApp();
});
