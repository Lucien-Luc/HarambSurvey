// Analytics and Reporting
class SurveyAnalytics {
    constructor() {
        this.charts = {};
        this.currentSurveyId = null;
        this.surveys = [];
        this.responses = [];
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        // Analytics filter change
        const analyticsFilter = document.getElementById('analyticsFilter');
        if (analyticsFilter) {
            analyticsFilter.addEventListener('change', this.onSurveyFilterChange.bind(this));
        }
        
        // Date range filters
        const dateRangeFilter = document.getElementById('analyticsDateRange');
        if (dateRangeFilter) {
            dateRangeFilter.addEventListener('change', this.onDateRangeChange.bind(this));
        }
        
        // Export analytics
        const exportAnalyticsBtn = document.getElementById('exportAnalyticsBtn');
        if (exportAnalyticsBtn) {
            exportAnalyticsBtn.addEventListener('click', this.exportAnalytics.bind(this));
        }
        
        // Refresh analytics
        const refreshAnalyticsBtn = document.getElementById('refreshAnalyticsBtn');
        if (refreshAnalyticsBtn) {
            refreshAnalyticsBtn.addEventListener('click', this.refreshAnalytics.bind(this));
        }
    }
    
    setSurveys(surveys) {
        this.surveys = surveys;
    }
    
    setResponses(responses) {
        this.responses = responses;
        this.updateCharts();
    }
    
    onSurveyFilterChange(e) {
        this.currentSurveyId = e.target.value;
        this.loadSurveyAnalytics(this.currentSurveyId);
    }
    
    onDateRangeChange() {
        if (this.currentSurveyId) {
            this.loadSurveyAnalytics(this.currentSurveyId);
        }
    }
    
    loadSurveyAnalytics(surveyId) {
        if (!surveyId) {
            this.showEmptyAnalytics();
            return;
        }
        
        this.currentSurveyId = surveyId;
        const survey = this.surveys.find(s => s.id === surveyId);
        const surveyResponses = this.getFilteredResponses(surveyId);
        
        if (!survey) {
            this.showEmptyAnalytics();
            return;
        }
        
        this.renderAnalyticsDashboard(survey, surveyResponses);
    }
    
    getFilteredResponses(surveyId) {
        let responses = this.responses.filter(r => r.surveyId === surveyId);
        
        // Apply date range filter if set
        const dateRange = document.getElementById('analyticsDateRange')?.value;
        if (dateRange) {
            const now = new Date();
            let startDate;
            
            switch (dateRange) {
                case '7days':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30days':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case '90days':
                    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = null;
            }
            
            if (startDate) {
                responses = responses.filter(r => r.submittedAt.toDate() >= startDate);
            }
        }
        
        return responses;
    }
    
    showEmptyAnalytics() {
        const analyticsContent = document.getElementById('analyticsContent');
        if (analyticsContent) {
            analyticsContent.innerHTML = `
                <div class="analytics-empty">
                    <i class="fas fa-chart-bar"></i>
                    <p>Select a survey to view analytics</p>
                </div>
            `;
        }
    }
    
    renderAnalyticsDashboard(survey, responses) {
        const analyticsContent = document.getElementById('analyticsContent');
        if (!analyticsContent) return;
        
        const summaryStats = this.calculateSummaryStats(survey, responses);
        
        analyticsContent.innerHTML = `
            ${this.renderSummaryStats(summaryStats)}
            ${this.renderResponseTrends(responses)}
            ${this.renderQuestionAnalytics(survey, responses)}
            ${this.renderDeviceBreakdown(responses)}
            ${this.renderCompletionAnalysis(responses)}
        `;
        
        // Initialize charts after DOM update
        setTimeout(() => {
            this.initializeCharts(survey, responses);
        }, 100);
    }
    
    calculateSummaryStats(survey, responses) {
        const totalResponses = responses.length;
        const completedResponses = responses.filter(r => r.status === 'completed').length;
        const completionRate = totalResponses > 0 ? (completedResponses / totalResponses) * 100 : 0;
        
        // Calculate average completion time (if we had start time data)
        const avgCompletionTime = 'N/A'; // Would need start time tracking
        
        // Most recent response
        const latestResponse = responses.length > 0 ? 
            responses.reduce((latest, current) => 
                current.submittedAt.toDate() > latest.submittedAt.toDate() ? current : latest
            ) : null;
        
        return {
            totalResponses,
            completedResponses,
            completionRate: Math.round(completionRate),
            avgCompletionTime,
            latestResponse: latestResponse ? Utils.formatDate(latestResponse.submittedAt, 'relative') : 'None'
        };
    }
    
    renderSummaryStats(stats) {
        return `
            <div class="analytics-summary">
                <div class="summary-card">
                    <div class="summary-value">${stats.totalResponses}</div>
                    <div class="summary-label">Total Responses</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${stats.completedResponses}</div>
                    <div class="summary-label">Completed</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${stats.completionRate}%</div>
                    <div class="summary-label">Completion Rate</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${stats.avgCompletionTime}</div>
                    <div class="summary-label">Avg. Time</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${stats.latestResponse}</div>
                    <div class="summary-label">Latest Response</div>
                </div>
            </div>
        `;
    }
    
    renderResponseTrends(responses) {
        return `
            <div class="analytics-chart">
                <h3>Response Trends</h3>
                <canvas id="responseTrendsChart" width="400" height="200"></canvas>
            </div>
        `;
    }
    
    renderQuestionAnalytics(survey, responses) {
        if (!survey.questions || survey.questions.length === 0) {
            return '';
        }
        
        return `
            <div class="analytics-section">
                <h3>Question Analysis</h3>
                <div class="question-analytics">
                    ${survey.questions.map((question, index) => 
                        this.renderQuestionAnalytic(question, responses, index)
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    renderQuestionAnalytic(question, responses, index) {
        const questionResponses = responses
            .map(r => r.responses && r.responses[question.id])
            .filter(response => response !== undefined && response !== null && response !== '');
        
        const responseCount = questionResponses.length;
        const responseRate = responses.length > 0 ? Math.round((responseCount / responses.length) * 100) : 0;
        
        let analysisContent = '';
        
        switch (question.type) {
            case 'radio':
            case 'select':
                analysisContent = this.renderChoiceAnalysis(question, questionResponses, index);
                break;
            case 'checkbox':
                analysisContent = this.renderMultiChoiceAnalysis(question, questionResponses, index);
                break;
            case 'rating':
                analysisContent = this.renderRatingAnalysis(question, questionResponses, index);
                break;
            case 'number':
                analysisContent = this.renderNumberAnalysis(question, questionResponses);
                break;
            default:
                analysisContent = this.renderTextAnalysis(question, questionResponses);
        }
        
        return `
            <div class="question-analytic">
                <div class="question-analytic-header">
                    <h4>${Utils.sanitizeHtml(question.title)}</h4>
                    <div class="question-stats">
                        <span class="response-count">${responseCount} responses</span>
                        <span class="response-rate">(${responseRate}%)</span>
                    </div>
                </div>
                <div class="question-analytic-content">
                    ${analysisContent}
                </div>
            </div>
        `;
    }
    
    renderChoiceAnalysis(question, responses, index) {
        if (!question.options || responses.length === 0) {
            return '<p class="text-muted">No responses yet</p>';
        }
        
        const counts = {};
        question.options.forEach(option => {
            counts[option.value] = 0;
        });
        
        responses.forEach(response => {
            if (counts.hasOwnProperty(response)) {
                counts[response]++;
            }
        });
        
        const total = responses.length;
        
        return `
            <div class="choice-analysis">
                <div class="choice-stats">
                    ${question.options.map(option => {
                        const count = counts[option.value];
                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                        
                        return `
                            <div class="choice-stat">
                                <div class="choice-label">${Utils.sanitizeHtml(option.label)}</div>
                                <div class="choice-bar">
                                    <div class="choice-fill" style="width: ${percentage}%"></div>
                                    <span class="choice-percentage">${count} (${percentage}%)</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <canvas id="questionChart${index}" width="300" height="200"></canvas>
            </div>
        `;
    }
    
    renderMultiChoiceAnalysis(question, responses, index) {
        if (!question.options || responses.length === 0) {
            return '<p class="text-muted">No responses yet</p>';
        }
        
        const counts = {};
        question.options.forEach(option => {
            counts[option.value] = 0;
        });
        
        responses.forEach(response => {
            if (Array.isArray(response)) {
                response.forEach(value => {
                    if (counts.hasOwnProperty(value)) {
                        counts[value]++;
                    }
                });
            }
        });
        
        const total = responses.length;
        
        return `
            <div class="choice-analysis">
                <div class="choice-stats">
                    ${question.options.map(option => {
                        const count = counts[option.value];
                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                        
                        return `
                            <div class="choice-stat">
                                <div class="choice-label">${Utils.sanitizeHtml(option.label)}</div>
                                <div class="choice-bar">
                                    <div class="choice-fill" style="width: ${percentage}%"></div>
                                    <span class="choice-percentage">${count} (${percentage}%)</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <canvas id="questionChart${index}" width="300" height="200"></canvas>
            </div>
        `;
    }
    
    renderRatingAnalysis(question, responses, index) {
        if (responses.length === 0) {
            return '<p class="text-muted">No responses yet</p>';
        }
        
        const numericResponses = responses.map(r => parseFloat(r)).filter(r => !isNaN(r));
        
        if (numericResponses.length === 0) {
            return '<p class="text-muted">No valid numeric responses</p>';
        }
        
        const average = numericResponses.reduce((sum, val) => sum + val, 0) / numericResponses.length;
        const min = Math.min(...numericResponses);
        const max = Math.max(...numericResponses);
        
        const distribution = {};
        for (let i = question.min || 1; i <= (question.max || 5); i++) {
            distribution[i] = 0;
        }
        
        numericResponses.forEach(response => {
            distribution[response] = (distribution[response] || 0) + 1;
        });
        
        return `
            <div class="rating-analysis">
                <div class="rating-stats">
                    <div class="rating-summary">
                        <div class="rating-metric">
                            <span class="metric-value">${average.toFixed(1)}</span>
                            <span class="metric-label">Average</span>
                        </div>
                        <div class="rating-metric">
                            <span class="metric-value">${min}</span>
                            <span class="metric-label">Minimum</span>
                        </div>
                        <div class="rating-metric">
                            <span class="metric-value">${max}</span>
                            <span class="metric-label">Maximum</span>
                        </div>
                    </div>
                    <div class="rating-distribution">
                        ${Object.keys(distribution).map(rating => {
                            const count = distribution[rating];
                            const percentage = numericResponses.length > 0 ? Math.round((count / numericResponses.length) * 100) : 0;
                            
                            return `
                                <div class="rating-dist-item">
                                    <span class="rating-value">${rating}</span>
                                    <div class="rating-bar">
                                        <div class="rating-fill" style="width: ${percentage}%"></div>
                                    </div>
                                    <span class="rating-count">${count}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                <canvas id="questionChart${index}" width="300" height="200"></canvas>
            </div>
        `;
    }
    
    renderNumberAnalysis(question, responses) {
        if (responses.length === 0) {
            return '<p class="text-muted">No responses yet</p>';
        }
        
        const numericResponses = responses.map(r => parseFloat(r)).filter(r => !isNaN(r));
        
        if (numericResponses.length === 0) {
            return '<p class="text-muted">No valid numeric responses</p>';
        }
        
        const sum = numericResponses.reduce((acc, val) => acc + val, 0);
        const average = sum / numericResponses.length;
        const min = Math.min(...numericResponses);
        const max = Math.max(...numericResponses);
        const median = this.calculateMedian(numericResponses);
        
        return `
            <div class="number-analysis">
                <div class="number-stats">
                    <div class="number-metric">
                        <span class="metric-value">${average.toFixed(2)}</span>
                        <span class="metric-label">Average</span>
                    </div>
                    <div class="number-metric">
                        <span class="metric-value">${median}</span>
                        <span class="metric-label">Median</span>
                    </div>
                    <div class="number-metric">
                        <span class="metric-value">${min}</span>
                        <span class="metric-label">Minimum</span>
                    </div>
                    <div class="number-metric">
                        <span class="metric-value">${max}</span>
                        <span class="metric-label">Maximum</span>
                    </div>
                    <div class="number-metric">
                        <span class="metric-value">${sum}</span>
                        <span class="metric-label">Sum</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderTextAnalysis(question, responses) {
        if (responses.length === 0) {
            return '<p class="text-muted">No responses yet</p>';
        }
        
        const totalLength = responses.reduce((sum, response) => sum + response.toString().length, 0);
        const averageLength = Math.round(totalLength / responses.length);
        const longestResponse = responses.reduce((longest, current) => 
            current.toString().length > longest.toString().length ? current : longest, ''
        );
        
        return `
            <div class="text-analysis">
                <div class="text-stats">
                    <div class="text-metric">
                        <span class="metric-value">${responses.length}</span>
                        <span class="metric-label">Total Responses</span>
                    </div>
                    <div class="text-metric">
                        <span class="metric-value">${averageLength}</span>
                        <span class="metric-label">Avg. Length</span>
                    </div>
                    <div class="text-metric">
                        <span class="metric-value">${longestResponse.toString().length}</span>
                        <span class="metric-label">Longest</span>
                    </div>
                </div>
                <div class="sample-responses">
                    <h5>Sample Responses:</h5>
                    <div class="response-samples">
                        ${responses.slice(0, 3).map(response => `
                            <div class="response-sample">
                                "${Utils.sanitizeHtml(response.toString().substring(0, 100))}${response.toString().length > 100 ? '...' : ''}"
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    calculateMedian(numbers) {
        const sorted = [...numbers].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return ((sorted[middle - 1] + sorted[middle]) / 2).toFixed(2);
        } else {
            return sorted[middle].toFixed(2);
        }
    }
    
    renderDeviceBreakdown(responses) {
        const deviceCounts = {};
        
        responses.forEach(response => {
            const device = response.deviceInfo?.device || 'Unknown';
            deviceCounts[device] = (deviceCounts[device] || 0) + 1;
        });
        
        const total = responses.length;
        
        return `
            <div class="analytics-chart">
                <h3>Device Breakdown</h3>
                <div class="device-breakdown">
                    ${Object.keys(deviceCounts).map(device => {
                        const count = deviceCounts[device];
                        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                        
                        return `
                            <div class="device-stat">
                                <i class="fas fa-${this.getDeviceIcon(device)}"></i>
                                <span class="device-name">${Utils.sanitizeHtml(device)}</span>
                                <span class="device-count">${count} (${percentage}%)</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <canvas id="deviceChart" width="300" height="200"></canvas>
            </div>
        `;
    }
    
    getDeviceIcon(device) {
        const deviceLower = device.toLowerCase();
        if (deviceLower.includes('iphone') || deviceLower.includes('mobile')) return 'mobile-alt';
        if (deviceLower.includes('ipad') || deviceLower.includes('tablet')) return 'tablet-alt';
        if (deviceLower.includes('android')) return 'android';
        return 'desktop';
    }
    
    renderCompletionAnalysis(responses) {
        const completed = responses.filter(r => r.status === 'completed').length;
        const partial = responses.filter(r => r.status === 'partial').length;
        const total = responses.length;
        
        return `
            <div class="analytics-chart">
                <h3>Completion Analysis</h3>
                <div class="completion-stats">
                    <div class="completion-stat">
                        <span class="completion-label">Completed</span>
                        <span class="completion-count">${completed}</span>
                        <div class="completion-bar">
                            <div class="completion-fill completed" style="width: ${total > 0 ? (completed / total) * 100 : 0}%"></div>
                        </div>
                    </div>
                    <div class="completion-stat">
                        <span class="completion-label">Partial</span>
                        <span class="completion-count">${partial}</span>
                        <div class="completion-bar">
                            <div class="completion-fill partial" style="width: ${total > 0 ? (partial / total) * 100 : 0}%"></div>
                        </div>
                    </div>
                </div>
                <canvas id="completionChart" width="300" height="200"></canvas>
            </div>
        `;
    }
    
    initializeCharts(survey, responses) {
        this.destroyExistingCharts();
        
        // Response trends chart
        this.createResponseTrendsChart(responses);
        
        // Question charts
        if (survey.questions) {
            survey.questions.forEach((question, index) => {
                if (['radio', 'select', 'checkbox', 'rating'].includes(question.type)) {
                    this.createQuestionChart(question, responses, index);
                }
            });
        }
        
        // Device breakdown chart
        this.createDeviceChart(responses);
        
        // Completion chart
        this.createCompletionChart(responses);
    }
    
    createResponseTrendsChart(responses) {
        const ctx = document.getElementById('responseTrendsChart');
        if (!ctx) return;
        
        // Group responses by date (last 30 days)
        const last30Days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last30Days.push(date.toISOString().split('T')[0]);
        }
        
        const responsesByDate = {};
        last30Days.forEach(date => responsesByDate[date] = 0);
        
        responses.forEach(response => {
            const date = response.submittedAt.toDate().toISOString().split('T')[0];
            if (responsesByDate.hasOwnProperty(date)) {
                responsesByDate[date]++;
            }
        });
        
        this.charts.responseTrends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last30Days.map(date => new Date(date).toLocaleDateString()),
                datasets: [{
                    label: 'Responses',
                    data: last30Days.map(date => responsesByDate[date]),
                    borderColor: '#2DD4BF',
                    backgroundColor: 'rgba(45, 212, 191, 0.1)',
                    tension: 0.4,
                    fill: true
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
                    },
                    x: {
                        ticks: {
                            maxTicksLimit: 10
                        }
                    }
                }
            }
        });
    }
    
    createQuestionChart(question, responses, index) {
        const ctx = document.getElementById(`questionChart${index}`);
        if (!ctx) return;
        
        const questionResponses = responses
            .map(r => r.responses && r.responses[question.id])
            .filter(response => response !== undefined && response !== null && response !== '');
        
        if (questionResponses.length === 0) return;
        
        switch (question.type) {
            case 'radio':
            case 'select':
                this.createChoiceChart(ctx, question, questionResponses, index);
                break;
            case 'checkbox':
                this.createMultiChoiceChart(ctx, question, questionResponses, index);
                break;
            case 'rating':
                this.createRatingChart(ctx, question, questionResponses, index);
                break;
        }
    }
    
    createChoiceChart(ctx, question, responses, index) {
        const counts = {};
        const labels = [];
        const colors = [];
        
        question.options.forEach((option, i) => {
            counts[option.value] = 0;
            labels.push(option.label);
            colors.push(this.getChartColor(i));
        });
        
        responses.forEach(response => {
            if (counts.hasOwnProperty(response)) {
                counts[response]++;
            }
        });
        
        const data = question.options.map(option => counts[option.value]);
        
        this.charts[`question${index}`] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    createMultiChoiceChart(ctx, question, responses, index) {
        const counts = {};
        const labels = [];
        const colors = [];
        
        question.options.forEach((option, i) => {
            counts[option.value] = 0;
            labels.push(option.label);
            colors.push(this.getChartColor(i));
        });
        
        responses.forEach(response => {
            if (Array.isArray(response)) {
                response.forEach(value => {
                    if (counts.hasOwnProperty(value)) {
                        counts[value]++;
                    }
                });
            }
        });
        
        const data = question.options.map(option => counts[option.value]);
        
        this.charts[`question${index}`] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Selections',
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 1
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
    
    createRatingChart(ctx, question, responses, index) {
        const distribution = {};
        const labels = [];
        
        for (let i = question.min || 1; i <= (question.max || 5); i++) {
            distribution[i] = 0;
            labels.push(i.toString());
        }
        
        responses.forEach(response => {
            const numResponse = parseFloat(response);
            if (!isNaN(numResponse) && distribution.hasOwnProperty(numResponse)) {
                distribution[numResponse]++;
            }
        });
        
        const data = labels.map(label => distribution[parseInt(label)]);
        
        this.charts[`question${index}`] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Responses',
                    data: data,
                    backgroundColor: '#2DD4BF',
                    borderWidth: 1
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
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Rating'
                        }
                    }
                }
            }
        });
    }
    
    createDeviceChart(responses) {
        const ctx = document.getElementById('deviceChart');
        if (!ctx) return;
        
        const deviceCounts = {};
        
        responses.forEach(response => {
            const device = response.deviceInfo?.device || 'Unknown';
            deviceCounts[device] = (deviceCounts[device] || 0) + 1;
        });
        
        const labels = Object.keys(deviceCounts);
        const data = Object.values(deviceCounts);
        const colors = labels.map((_, i) => this.getChartColor(i));
        
        this.charts.device = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    createCompletionChart(responses) {
        const ctx = document.getElementById('completionChart');
        if (!ctx) return;
        
        const completed = responses.filter(r => r.status === 'completed').length;
        const partial = responses.filter(r => r.status === 'partial').length;
        
        this.charts.completion = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Partial'],
                datasets: [{
                    data: [completed, partial],
                    backgroundColor: ['#10B981', '#F59E0B'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    getChartColor(index) {
        const colors = [
            '#2DD4BF', '#10B981', '#6B7280', '#F59E0B', '#EF4444',
            '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899'
        ];
        return colors[index % colors.length];
    }
    
    destroyExistingCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
    
    updateCharts() {
        if (this.currentSurveyId) {
            this.loadSurveyAnalytics(this.currentSurveyId);
        }
    }
    
    async exportAnalytics() {
        if (!this.currentSurveyId) {
            Utils.showError('Please select a survey first');
            return;
        }
        
        const survey = this.surveys.find(s => s.id === this.currentSurveyId);
        const responses = this.getFilteredResponses(this.currentSurveyId);
        
        if (responses.length === 0) {
            Utils.showWarning('No data to export');
            return;
        }
        
        Utils.showLoading('Preparing analytics export...');
        
        try {
            const exportData = this.prepareAnalyticsExport(survey, responses);
            const filename = `${Utils.slugify(survey.title)}_analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            const result = Utils.exportToExcel(exportData, filename);
            
            if (result.success) {
                Utils.showSuccess('Analytics exported successfully');
            } else {
                Utils.showError('Failed to export analytics');
            }
        } catch (error) {
            console.error('Error exporting analytics:', error);
            Utils.showError('Failed to export analytics');
        } finally {
            Utils.hideLoading();
        }
    }
    
    prepareAnalyticsExport(survey, responses) {
        const workbook = [];
        
        // Summary sheet
        const summaryStats = this.calculateSummaryStats(survey, responses);
        workbook.push({
            name: 'Summary',
            data: [
                ['Metric', 'Value'],
                ['Survey Title', survey.title],
                ['Total Responses', summaryStats.totalResponses],
                ['Completed Responses', summaryStats.completedResponses],
                ['Completion Rate', `${summaryStats.completionRate}%`],
                ['Export Date', new Date().toLocaleDateString()]
            ]
        });
        
        // Question analysis sheets
        if (survey.questions) {
            survey.questions.forEach((question, index) => {
                const questionResponses = responses
                    .map(r => r.responses && r.responses[question.id])
                    .filter(response => response !== undefined && response !== null && response !== '');
                
                if (questionResponses.length > 0) {
                    const questionData = this.prepareQuestionExportData(question, questionResponses);
                    workbook.push({
                        name: `Q${index + 1} - ${question.title.substring(0, 20)}`,
                        data: questionData
                    });
                }
            });
        }
        
        return workbook;
    }
    
    prepareQuestionExportData(question, responses) {
        const data = [
            ['Question', question.title],
            ['Type', question.type],
            ['Total Responses', responses.length],
            [''],
            ['Response', 'Count', 'Percentage']
        ];
        
        switch (question.type) {
            case 'radio':
            case 'select':
                if (question.options) {
                    const counts = {};
                    question.options.forEach(option => counts[option.value] = 0);
                    
                    responses.forEach(response => {
                        if (counts.hasOwnProperty(response)) {
                            counts[response]++;
                        }
                    });
                    
                    question.options.forEach(option => {
                        const count = counts[option.value];
                        const percentage = responses.length > 0 ? ((count / responses.length) * 100).toFixed(1) : 0;
                        data.push([option.label, count, `${percentage}%`]);
                    });
                }
                break;
                
            case 'checkbox':
                if (question.options) {
                    const counts = {};
                    question.options.forEach(option => counts[option.value] = 0);
                    
                    responses.forEach(response => {
                        if (Array.isArray(response)) {
                            response.forEach(value => {
                                if (counts.hasOwnProperty(value)) {
                                    counts[value]++;
                                }
                            });
                        }
                    });
                    
                    question.options.forEach(option => {
                        const count = counts[option.value];
                        const percentage = responses.length > 0 ? ((count / responses.length) * 100).toFixed(1) : 0;
                        data.push([option.label, count, `${percentage}%`]);
                    });
                }
                break;
                
            case 'rating':
                const numericResponses = responses.map(r => parseFloat(r)).filter(r => !isNaN(r));
                if (numericResponses.length > 0) {
                    const average = numericResponses.reduce((sum, val) => sum + val, 0) / numericResponses.length;
                    data.push(['Average', average.toFixed(2), '']);
                    data.push(['Minimum', Math.min(...numericResponses), '']);
                    data.push(['Maximum', Math.max(...numericResponses), '']);
                    data.push(['Median', this.calculateMedian(numericResponses), '']);
                }
                break;
                
            default:
                // For text and other types, just list unique responses
                const uniqueResponses = [...new Set(responses)];
                uniqueResponses.forEach(response => {
                    const count = responses.filter(r => r === response).length;
                    const percentage = responses.length > 0 ? ((count / responses.length) * 100).toFixed(1) : 0;
                    data.push([response, count, `${percentage}%`]);
                });
        }
        
        return data;
    }
    
    refreshAnalytics() {
        if (this.currentSurveyId) {
            Utils.showLoading('Refreshing analytics...');
            setTimeout(() => {
                this.loadSurveyAnalytics(this.currentSurveyId);
                Utils.hideLoading();
                Utils.showSuccess('Analytics refreshed');
            }, 1000);
        }
    }
}

// Initialize analytics
document.addEventListener('DOMContentLoaded', () => {
    window.analytics = new SurveyAnalytics();
});
