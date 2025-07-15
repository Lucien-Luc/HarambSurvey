// Admin Dashboard Functionality
class AdminManager {
    constructor() {
        this.surveys = [];
        this.responses = [];
        this.users = [];
        this.currentEditingSurvey = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupRealTimeListeners();
    }
    
    bindEvents() {
        // Survey management buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="edit-survey"]')) {
                this.editSurvey(e.target.dataset.surveyId);
            } else if (e.target.matches('[data-action="delete-survey"]')) {
                this.deleteSurvey(e.target.dataset.surveyId);
            } else if (e.target.matches('[data-action="duplicate-survey"]')) {
                this.duplicateSurvey(e.target.dataset.surveyId);
            } else if (e.target.matches('[data-action="toggle-status"]')) {
                this.toggleSurveyStatus(e.target.dataset.surveyId);
            } else if (e.target.matches('[data-action="view-responses"]')) {
                this.viewSurveyResponses(e.target.dataset.surveyId);
            } else if (e.target.matches('[data-action="export-responses"]')) {
                this.exportSurveyResponses(e.target.dataset.surveyId);
            }
        });
        
        // Bulk operations
        const selectAllCheckbox = document.getElementById('selectAllResponses');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', this.toggleSelectAllResponses.bind(this));
        }
        
        // Search and filter functionality
        const searchInput = document.getElementById('searchSurveys');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(this.searchSurveys.bind(this), 300));
        }
        
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', this.filterSurveysByStatus.bind(this));
        }
        
        // Date range filter
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        if (dateFrom && dateTo) {
            dateFrom.addEventListener('change', this.filterByDateRange.bind(this));
            dateTo.addEventListener('change', this.filterByDateRange.bind(this));
        }
    }
    
    setupRealTimeListeners() {
        // Listen to surveys collection
        this.surveysUnsubscribe = window.firebaseConfig.listenToCollection(
            'surveys',
            (surveys, error) => {
                if (error) {
                    console.error('Error listening to surveys:', error);
                    // Fall back to demo mode when Firebase permissions fail
                    if (error.code === 'permission-denied') {
                        console.log('Firebase permission denied, loading demo data...');
                        this.loadDemoData();
                    }
                    return;
                }
                
                this.surveys = surveys || [];
                this.updateSurveysList();
                this.updateDashboardStats();
            },
            { field: 'createdAt', direction: 'desc' }
        );
        
        // Listen to responses collection
        this.responsesUnsubscribe = window.firebaseConfig.listenToCollection(
            'responses',
            (responses, error) => {
                if (error) {
                    console.error('Error listening to responses:', error);
                    // Fall back to demo mode when Firebase permissions fail
                    if (error.code === 'permission-denied') {
                        console.log('Firebase permission denied, loading demo data...');
                        this.loadDemoData();
                    }
                    return;
                }
                
                this.responses = responses || [];
                this.updateResponsesList();
                this.updateDashboardStats();
                this.updateAnalytics();
            },
            { field: 'submittedAt', direction: 'desc' }
        );
    }
    
    loadDemoData() {
        // Load demo surveys and responses if not already loaded
        if (this.surveys.length === 0 && window.app && window.app.surveys) {
            this.surveys = window.app.surveys;
            this.updateSurveysList();
        }
        
        if (this.responses.length === 0 && window.app && window.app.responses) {
            this.responses = window.app.responses;
            this.updateResponsesList();
        }
        
        this.updateDashboardStats();
        this.updateAnalytics();
    }
    
    updateSurveysList() {
        const surveysList = document.getElementById('surveysList');
        if (!surveysList) return;
        
        const filteredSurveys = this.getFilteredSurveys();
        
        if (filteredSurveys.length === 0) {
            surveysList.innerHTML = this.getEmptySurveysHTML();
            return;
        }
        
        const surveysHTML = filteredSurveys.map(survey => this.getSurveyItemHTML(survey)).join('');
        surveysList.innerHTML = surveysHTML;
    }
    
    getFilteredSurveys() {
        let filtered = [...this.surveys];
        
        // Search filter
        const searchTerm = document.getElementById('searchSurveys')?.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(survey => 
                survey.title.toLowerCase().includes(searchTerm) ||
                (survey.description && survey.description.toLowerCase().includes(searchTerm))
            );
        }
        
        // Status filter
        const statusFilter = document.getElementById('statusFilter')?.value;
        if (statusFilter) {
            filtered = filtered.filter(survey => survey.status === statusFilter);
        }
        
        // Date range filter
        const dateFrom = document.getElementById('dateFrom')?.value;
        const dateTo = document.getElementById('dateTo')?.value;
        
        if (dateFrom || dateTo) {
            filtered = filtered.filter(survey => {
                if (!survey.createdAt) return false;
                const createdDate = survey.createdAt.toDate ? survey.createdAt.toDate() : new Date(survey.createdAt);
                const fromDate = dateFrom ? new Date(dateFrom) : new Date('1970-01-01');
                const toDate = dateTo ? new Date(dateTo) : new Date();
                
                return createdDate >= fromDate && createdDate <= toDate;
            });
        }
        
        return filtered;
    }
    
    getSurveyItemHTML(survey) {
        const responseCount = this.responses.filter(r => r.surveyId === survey.id).length;
        const completedCount = this.responses.filter(r => r.surveyId === survey.id && r.status === 'completed').length;
        const completionRate = responseCount > 0 ? Math.round((completedCount / responseCount) * 100) : 0;
        
        const statusClass = survey.status || 'draft';
        const questionsCount = survey.questions ? survey.questions.length : 0;
        
        return `
            <div class="survey-item" data-survey-id="${survey.id}">
                <div class="survey-item-header">
                    <div class="survey-item-info">
                        <div class="survey-item-title">${Utils.sanitizeHtml(survey.title)}</div>
                        <div class="survey-item-description">${Utils.sanitizeHtml(survey.description || 'No description')}</div>
                        <div class="survey-item-meta-small">
                            Created ${Utils.formatDate(survey.createdAt, 'relative')} • 
                            ${questionsCount} question${questionsCount !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <div class="survey-item-actions">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline dropdown-toggle">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-menu">
                                <a href="#" data-action="edit-survey" data-survey-id="${survey.id}">
                                    <i class="fas fa-edit"></i> Edit
                                </a>
                                <a href="#" data-action="duplicate-survey" data-survey-id="${survey.id}">
                                    <i class="fas fa-copy"></i> Duplicate
                                </a>
                                <a href="#" data-action="view-responses" data-survey-id="${survey.id}">
                                    <i class="fas fa-users"></i> View Responses
                                </a>
                                <a href="#" onclick="app.copySurveyLink('${survey.id}')">
                                    <i class="fas fa-link"></i> Copy Link
                                </a>
                                <div class="dropdown-divider"></div>
                                <a href="#" data-action="toggle-status" data-survey-id="${survey.id}">
                                    <i class="fas fa-${survey.status === 'active' ? 'pause' : 'play'}"></i> 
                                    ${survey.status === 'active' ? 'Deactivate' : 'Activate'}
                                </a>
                                <a href="#" data-action="export-responses" data-survey-id="${survey.id}">
                                    <i class="fas fa-download"></i> Export Data
                                </a>
                                <div class="dropdown-divider"></div>
                                <a href="#" data-action="delete-survey" data-survey-id="${survey.id}" class="text-danger">
                                    <i class="fas fa-trash"></i> Delete
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="survey-item-stats">
                    <div class="stat-grid">
                        <div class="stat-item">
                            <div class="stat-value">${responseCount}</div>
                            <div class="stat-label">Total Responses</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${completedCount}</div>
                            <div class="stat-label">Completed</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-value">${completionRate}%</div>
                            <div class="stat-label">Completion Rate</div>
                        </div>
                        <div class="stat-item">
                            <span class="survey-status ${statusClass}">${statusClass.charAt(0).toUpperCase() + statusClass.slice(1)}</span>
                        </div>
                    </div>
                </div>
                
                ${responseCount > 0 ? this.getSurveyMiniChart(survey.id) : ''}
            </div>
        `;
    }
    
    getSurveyMiniChart(surveyId) {
        const surveyResponses = this.responses.filter(r => r.surveyId === surveyId);
        if (surveyResponses.length === 0) return '';
        
        // Get last 7 days of responses
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }
        
        const responsesByDate = {};
        last7Days.forEach(date => responsesByDate[date] = 0);
        
        surveyResponses.forEach(response => {
            if (!response.submittedAt) return;
            const responseDate = response.submittedAt.toDate ? response.submittedAt.toDate() : new Date(response.submittedAt);
            const date = responseDate.toISOString().split('T')[0];
            if (responsesByDate.hasOwnProperty(date)) {
                responsesByDate[date]++;
            }
        });
        
        const chartData = last7Days.map(date => responsesByDate[date]);
        const maxValue = Math.max(...chartData, 1);
        
        return `
            <div class="survey-mini-chart">
                <div class="mini-chart-title">Last 7 days</div>
                <div class="mini-chart-bars">
                    ${chartData.map(value => `
                        <div class="mini-chart-bar" style="height: ${(value / maxValue) * 100}%"></div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    getEmptySurveysHTML() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas fa-poll"></i>
                </div>
                <h3>No Surveys Found</h3>
                <p>Create your first survey to start collecting responses</p>
                <button class="btn btn-primary" onclick="app.createNewSurvey()">
                    <i class="fas fa-plus"></i> Create Survey
                </button>
            </div>
        `;
    }
    
    updateResponsesList() {
        const responsesTableBody = document.getElementById('responsesTableBody');
        if (!responsesTableBody) return;
        
        const filteredResponses = this.getFilteredResponses();
        
        if (filteredResponses.length === 0) {
            responsesTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state-table">
                        <i class="fas fa-inbox"></i>
                        <div>No responses found</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        const responsesHTML = filteredResponses.map(response => this.getResponseRowHTML(response)).join('');
        responsesTableBody.innerHTML = responsesHTML;
    }
    
    getFilteredResponses() {
        const surveyFilter = document.getElementById('surveyFilter')?.value;
        const statusFilter = document.getElementById('responseStatusFilter')?.value;
        
        let filtered = [...this.responses];
        
        if (surveyFilter) {
            filtered = filtered.filter(response => response.surveyId === surveyFilter);
        }
        
        if (statusFilter) {
            filtered = filtered.filter(response => response.status === statusFilter);
        }
        
        return filtered.sort((a, b) => {
            const aDate = a.submittedAt?.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt || 0);
            const bDate = b.submittedAt?.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt || 0);
            return bDate - aDate;
        });
    }
    
    getResponseRowHTML(response) {
        const survey = this.surveys.find(s => s.id === response.surveyId);
        const surveyTitle = survey ? survey.title : 'Unknown Survey';
        
        return `
            <tr data-response-id="${response.id}">
                <td>
                    <input type="checkbox" class="response-checkbox" value="${response.id}">
                </td>
                <td>
                    <div class="response-id">${response.id.substring(0, 8)}...</div>
                </td>
                <td>
                    <div class="survey-title-cell">${Utils.sanitizeHtml(surveyTitle)}</div>
                </td>
                <td>${Utils.formatDate(response.submittedAt, 'datetime')}</td>
                <td>
                    <div class="device-info">
                        <i class="fas fa-${this.getDeviceIcon(response.deviceInfo?.device)}"></i>
                        ${Utils.sanitizeHtml(response.deviceInfo?.device || 'Unknown')}
                    </div>
                </td>
                <td><span class="response-status ${response.status}">${response.status}</span></td>
                <td>
                    <div class="response-actions">
                        <button class="btn btn-sm btn-outline" onclick="app.viewResponse('${response.id}')" title="View Response">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="admin.exportSingleResponse('${response.id}')" title="Export">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn btn-sm btn-outline text-danger" onclick="admin.deleteResponse('${response.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    getDeviceIcon(device) {
        if (!device) return 'desktop';
        
        const deviceLower = device.toLowerCase();
        if (deviceLower.includes('iphone') || deviceLower.includes('mobile')) return 'mobile-alt';
        if (deviceLower.includes('ipad') || deviceLower.includes('tablet')) return 'tablet-alt';
        if (deviceLower.includes('android')) return 'android';
        return 'desktop';
    }
    
    updateDashboardStats() {
        // Update survey count
        const totalSurveys = this.surveys.length;
        const activeSurveys = this.surveys.filter(s => s.status === 'active').length;
        const draftSurveys = this.surveys.filter(s => s.status === 'draft').length;
        
        // Update response stats
        const totalResponses = this.responses.length;
        const completedResponses = this.responses.filter(r => r.status === 'completed').length;
        
        // Today's responses
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayResponses = this.responses.filter(r => {
            if (!r.submittedAt) return false;
            const responseDate = r.submittedAt.toDate ? r.submittedAt.toDate() : new Date(r.submittedAt);
            return responseDate >= today;
        }).length;
        
        // Completion rate
        const completionRate = totalResponses > 0 ? Math.round((completedResponses / totalResponses) * 100) : 0;
        
        // Update UI elements
        this.updateStatElement('totalSurveys', totalSurveys);
        this.updateStatElement('activeSurveys', activeSurveys);
        this.updateStatElement('draftSurveys', draftSurveys);
        this.updateStatElement('totalResponses', totalResponses);
        this.updateStatElement('completedResponses', completedResponses);
        this.updateStatElement('todayResponses', todayResponses);
        this.updateStatElement('completionRate', `${completionRate}%`);
        
        // Update additional stats if elements exist
        this.updateStatElement('averageResponseTime', this.calculateAverageResponseTime());
        this.updateStatElement('mostPopularSurvey', this.getMostPopularSurvey());
    }
    
    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }
    
    calculateAverageResponseTime() {
        const completedResponses = this.responses.filter(r => r.status === 'completed');
        if (completedResponses.length === 0) return 'N/A';
        
        // This would require startedAt timestamp in practice
        // For now, return a placeholder
        return 'N/A';
    }
    
    getMostPopularSurvey() {
        if (this.surveys.length === 0) return 'None';
        
        const surveyResponseCounts = {};
        this.responses.forEach(response => {
            surveyResponseCounts[response.surveyId] = (surveyResponseCounts[response.surveyId] || 0) + 1;
        });
        
        const mostPopularId = Object.keys(surveyResponseCounts).reduce((a, b) => 
            surveyResponseCounts[a] > surveyResponseCounts[b] ? a : b, Object.keys(surveyResponseCounts)[0]
        );
        
        const mostPopularSurvey = this.surveys.find(s => s.id === mostPopularId);
        return mostPopularSurvey ? mostPopularSurvey.title : 'None';
    }
    
    // Survey Actions
    async editSurvey(surveyId) {
        const survey = this.surveys.find(s => s.id === surveyId);
        if (!survey) {
            Utils.showError('Survey not found');
            return;
        }
        
        this.currentEditingSurvey = survey;
        
        // Switch to form builder and load survey
        window.app.showAdminView('form-builder');
        
        if (window.formBuilder) {
            window.formBuilder.loadSurvey(survey);
        }
    }
    
    async duplicateSurvey(surveyId) {
        const survey = this.surveys.find(s => s.id === surveyId);
        if (!survey) {
            Utils.showError('Survey not found');
            return;
        }
        
        Utils.showLoading('Duplicating survey...');
        
        try {
            const duplicatedSurvey = {
                ...survey,
                title: `${survey.title} (Copy)`,
                status: 'draft'
            };
            
            delete duplicatedSurvey.id;
            delete duplicatedSurvey.createdAt;
            delete duplicatedSurvey.updatedAt;
            
            const result = await window.firebaseConfig.createDocument('surveys', duplicatedSurvey);
            
            if (result.success) {
                Utils.showSuccess('Survey duplicated successfully');
            } else {
                Utils.showError('Failed to duplicate survey');
            }
        } catch (error) {
            console.error('Error duplicating survey:', error);
            Utils.showError('Failed to duplicate survey');
        } finally {
            Utils.hideLoading();
        }
    }
    
    async toggleSurveyStatus(surveyId) {
        const survey = this.surveys.find(s => s.id === surveyId);
        if (!survey) {
            Utils.showError('Survey not found');
            return;
        }
        
        const newStatus = survey.status === 'active' ? 'draft' : 'active';
        
        Utils.showLoading('Updating survey status...');
        
        try {
            const result = await window.firebaseConfig.updateDocument('surveys', surveyId, {
                status: newStatus
            });
            
            if (result.success) {
                Utils.showSuccess(`Survey ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
            } else {
                Utils.showError('Failed to update survey status');
            }
        } catch (error) {
            console.error('Error updating survey status:', error);
            Utils.showError('Failed to update survey status');
        } finally {
            Utils.hideLoading();
        }
    }
    
    async deleteSurvey(surveyId) {
        const survey = this.surveys.find(s => s.id === surveyId);
        if (!survey) {
            Utils.showError('Survey not found');
            return;
        }
        
        const confirmMessage = `Are you sure you want to delete "${survey.title}"? This will also delete all associated responses. This action cannot be undone.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        Utils.showLoading('Deleting survey and responses...');
        
        try {
            // Delete all responses for this survey
            const surveyResponses = this.responses.filter(r => r.surveyId === surveyId);
            const deletePromises = surveyResponses.map(response => 
                window.firebaseConfig.deleteDocument('responses', response.id)
            );
            
            // Delete the survey
            deletePromises.push(window.firebaseConfig.deleteDocument('surveys', surveyId));
            
            await Promise.all(deletePromises);
            
            Utils.showSuccess('Survey and all responses deleted successfully');
        } catch (error) {
            console.error('Error deleting survey:', error);
            Utils.showError('Failed to delete survey');
        } finally {
            Utils.hideLoading();
        }
    }
    
    viewSurveyResponses(surveyId) {
        // Switch to responses view and filter by survey
        window.app.showAdminView('responses');
        
        // Set the survey filter
        const surveyFilter = document.getElementById('surveyFilter');
        if (surveyFilter) {
            surveyFilter.value = surveyId;
            // Trigger the filter update
            this.updateResponsesList();
        }
    }

    async exportSurveyResponses(surveyId) {
        const survey = this.surveys.find(s => s.id === surveyId);
        const surveyResponses = this.responses.filter(r => r.surveyId === surveyId);
        
        if (surveyResponses.length === 0) {
            Utils.showWarning('No responses to export for this survey');
            return;
        }
        
        Utils.showLoading('Preparing export...');
        
        try {
            const exportData = this.prepareExportData(surveyResponses, survey);
            const filename = `${Utils.slugify(survey.title)}_responses_${new Date().toISOString().split('T')[0]}.xlsx`;
            
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
    
    prepareExportData(responses, survey) {
        return responses.map(response => {
            const flatData = {
                'Response ID': response.id,
                'Survey': survey ? survey.title : 'Unknown',
                'Status': response.status,
                'Submitted At': Utils.formatDate(response.submittedAt, 'datetime'),
                'Device': response.deviceInfo?.device || 'Unknown',
                'User Agent': response.deviceInfo?.userAgent || '',
                'Timezone': response.deviceInfo?.timezone || '',
                'Language': response.deviceInfo?.language || ''
            };
            
            // Add question responses
            if (response.responses && survey && survey.questions) {
                survey.questions.forEach(question => {
                    const answer = response.responses[question.id];
                    let formattedAnswer = '';
                    
                    if (answer !== undefined && answer !== null && answer !== '') {
                        if (Array.isArray(answer)) {
                            formattedAnswer = answer.join(', ');
                        } else {
                            formattedAnswer = answer.toString();
                        }
                    }
                    
                    flatData[question.title] = formattedAnswer;
                });
            }
            
            return flatData;
        });
    }
    
    // Response Actions
    async deleteResponse(responseId) {
        if (!confirm('Are you sure you want to delete this response? This action cannot be undone.')) {
            return;
        }
        
        Utils.showLoading('Deleting response...');
        
        try {
            const result = await window.firebaseConfig.deleteDocument('responses', responseId);
            
            if (result.success) {
                Utils.showSuccess('Response deleted successfully');
            } else {
                Utils.showError('Failed to delete response');
            }
        } catch (error) {
            console.error('Error deleting response:', error);
            Utils.showError('Failed to delete response');
        } finally {
            Utils.hideLoading();
        }
    }
    
    async exportSingleResponse(responseId) {
        const response = this.responses.find(r => r.id === responseId);
        if (!response) {
            Utils.showError('Response not found');
            return;
        }
        
        const survey = this.surveys.find(s => s.id === response.surveyId);
        const exportData = this.prepareExportData([response], survey);
        
        const filename = `response_${responseId.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        const result = Utils.exportToExcel(exportData, filename);
        
        if (result.success) {
            Utils.showSuccess('Response exported successfully');
        } else {
            Utils.showError('Failed to export response');
        }
    }
    
    // Filter and Search Functions
    searchSurveys() {
        this.updateSurveysList();
    }
    
    filterSurveysByStatus() {
        this.updateSurveysList();
    }
    
    filterByDateRange() {
        this.updateSurveysList();
    }
    
    toggleSelectAllResponses(e) {
        const checkboxes = document.querySelectorAll('.response-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    }
    
    getSelectedResponses() {
        const checkboxes = document.querySelectorAll('.response-checkbox:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }
    
    async bulkDeleteResponses() {
        const selectedIds = this.getSelectedResponses();
        
        if (selectedIds.length === 0) {
            Utils.showWarning('Please select responses to delete');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} response(s)? This action cannot be undone.`)) {
            return;
        }
        
        Utils.showLoading('Deleting responses...');
        
        try {
            const deletePromises = selectedIds.map(id => 
                window.firebaseConfig.deleteDocument('responses', id)
            );
            
            await Promise.all(deletePromises);
            
            Utils.showSuccess(`${selectedIds.length} response(s) deleted successfully`);
            
            // Uncheck select all
            const selectAllCheckbox = document.getElementById('selectAllResponses');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
            }
        } catch (error) {
            console.error('Error bulk deleting responses:', error);
            Utils.showError('Failed to delete some responses');
        } finally {
            Utils.hideLoading();
        }
    }
    
    async bulkExportResponses() {
        const selectedIds = this.getSelectedResponses();
        
        if (selectedIds.length === 0) {
            Utils.showWarning('Please select responses to export');
            return;
        }
        
        Utils.showLoading('Preparing export...');
        
        try {
            const selectedResponses = this.responses.filter(r => selectedIds.includes(r.id));
            const exportData = this.prepareExportData(selectedResponses, null);
            
            const filename = `bulk_responses_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            const result = Utils.exportToExcel(exportData, filename);
            
            if (result.success) {
                Utils.showSuccess(`${selectedIds.length} response(s) exported successfully`);
            } else {
                Utils.showError('Failed to export responses');
            }
        } catch (error) {
            console.error('Error bulk exporting responses:', error);
            Utils.showError('Failed to export responses');
        } finally {
            Utils.hideLoading();
        }
    }
    
    updateAnalytics() {
        // Trigger analytics update if on analytics view
        if (window.app && window.app.currentAdminView === 'analytics') {
            if (window.analytics) {
                window.analytics.updateCharts();
            }
        }
    }
    
    // Cleanup
    destroy() {
        if (this.surveysUnsubscribe) {
            this.surveysUnsubscribe();
        }
        
        if (this.responsesUnsubscribe) {
            this.responsesUnsubscribe();
        }
    }
}

// Initialize admin manager
document.addEventListener('DOMContentLoaded', () => {
    window.admin = new AdminManager();
});
