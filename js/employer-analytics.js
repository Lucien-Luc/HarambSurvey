/**
 * Employer Diagnostic Analytics
 * Handles analytics and reporting for employer diagnostic form submissions
 */
class EmployerAnalytics {
    constructor() {
        this.charts = {};
        this.diagnostics = [];
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Export analytics
        const exportAnalyticsBtn = document.getElementById('exportEmployerAnalyticsBtn');
        if (exportAnalyticsBtn) {
            exportAnalyticsBtn.addEventListener('click', () => this.exportAnalytics());
        }

        // Refresh analytics
        const refreshAnalyticsBtn = document.getElementById('refreshEmployerAnalyticsBtn');
        if (refreshAnalyticsBtn) {
            refreshAnalyticsBtn.addEventListener('click', () => this.refreshAnalytics());
        }
    }

    setDiagnostics(diagnostics) {
        this.diagnostics = diagnostics;
        this.updateDashboard();
    }

    updateDashboard() {
        this.updateStatistics();
        this.updateCharts();
    }

    updateStatistics() {
        const stats = this.calculateStatistics();
        
        // Update stat elements
        this.updateStatElement('totalSubmissions', stats.totalSubmissions);
        this.updateStatElement('todaySubmissions', stats.todaySubmissions);
        this.updateStatElement('weekSubmissions', stats.weekSubmissions);
        this.updateStatElement('avgPositionsOffered', stats.avgPositionsOffered);
        this.updateStatElement('topIndustry', stats.topIndustry);
        this.updateStatElement('fullTimeJobs', stats.fullTimeJobs);
        this.updateStatElement('remoteJobs', stats.remoteJobs);
        this.updateStatElement('entryLevelJobs', stats.entryLevelJobs);
    }

    calculateStatistics() {
        const stats = {
            totalSubmissions: this.diagnostics.length,
            todaySubmissions: 0,
            weekSubmissions: 0,
            avgPositionsOffered: 0,
            topIndustry: 'N/A',
            fullTimeJobs: 0,
            remoteJobs: 0,
            entryLevelJobs: 0
        };

        if (this.diagnostics.length === 0) return stats;

        // Date calculations
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Industry count
        const industryCount = {};
        let totalPositions = 0;
        let workTypeCount = {};
        let workModeCount = {};
        let experienceCount = {};

        this.diagnostics.forEach(diagnostic => {
            // Date filters
            const submittedDate = new Date(diagnostic.submittedAt);
            if (submittedDate >= today) {
                stats.todaySubmissions++;
            }
            if (submittedDate >= weekAgo) {
                stats.weekSubmissions++;
            }

            // Industry tracking
            if (diagnostic.industry) {
                const industry = diagnostic.industry.toLowerCase();
                industryCount[industry] = (industryCount[industry] || 0) + 1;
            }

            // Positions count
            if (diagnostic.positionsAvailable) {
                totalPositions += parseInt(diagnostic.positionsAvailable) || 0;
            }

            // Work type tracking
            if (diagnostic.workType) {
                workTypeCount[diagnostic.workType] = (workTypeCount[diagnostic.workType] || 0) + 1;
            }

            // Work mode tracking
            if (diagnostic.workMode) {
                workModeCount[diagnostic.workMode] = (workModeCount[diagnostic.workMode] || 0) + 1;
            }

            // Experience level tracking
            if (diagnostic.experienceLevel) {
                experienceCount[diagnostic.experienceLevel] = (experienceCount[diagnostic.experienceLevel] || 0) + 1;
            }
        });

        // Calculate averages and top values
        stats.avgPositionsOffered = this.diagnostics.length > 0 ? 
            Math.round(totalPositions / this.diagnostics.length) : 0;

        // Find top industry
        const topIndustryKey = Object.keys(industryCount).reduce((a, b) => 
            industryCount[a] > industryCount[b] ? a : b, Object.keys(industryCount)[0]
        );
        stats.topIndustry = topIndustryKey ? 
            topIndustryKey.charAt(0).toUpperCase() + topIndustryKey.slice(1) : 'N/A';

        // Work type stats
        stats.fullTimeJobs = workTypeCount['full-time'] || 0;
        stats.remoteJobs = workModeCount['remote'] || 0;
        stats.entryLevelJobs = experienceCount['entry-level'] || 0;

        return stats;
    }

    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    updateCharts() {
        this.createIndustryChart();
        this.createWorkTypeChart();
        this.createExperienceLevelChart();
        this.createSubmissionTrendsChart();
        this.createBenefitsChart();
    }

    createIndustryChart() {
        const ctx = document.getElementById('industryChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.industry) {
            this.charts.industry.destroy();
        }

        const industryData = this.getIndustryDistribution();
        
        this.charts.industry = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: industryData.labels,
                datasets: [{
                    data: industryData.data,
                    backgroundColor: [
                        '#2DD4BF', '#10B981', '#6B7280', '#F59E0B', 
                        '#EF4444', '#8B5CF6', '#EC4899', '#84CC16'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Industry Distribution'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createWorkTypeChart() {
        const ctx = document.getElementById('workTypeChart');
        if (!ctx) return;

        if (this.charts.workType) {
            this.charts.workType.destroy();
        }

        const workTypeData = this.getWorkTypeDistribution();
        
        this.charts.workType = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: workTypeData.labels,
                datasets: [{
                    label: 'Job Openings',
                    data: workTypeData.data,
                    backgroundColor: '#2DD4BF'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Work Type Distribution'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createExperienceLevelChart() {
        const ctx = document.getElementById('experienceLevelChart');
        if (!ctx) return;

        if (this.charts.experienceLevel) {
            this.charts.experienceLevel.destroy();
        }

        const experienceData = this.getExperienceLevelDistribution();
        
        this.charts.experienceLevel = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: experienceData.labels,
                datasets: [{
                    data: experienceData.data,
                    backgroundColor: [
                        'rgba(45, 212, 191, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(107, 114, 128, 0.8)',
                        'rgba(245, 158, 11, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Experience Level Requirements'
                    }
                }
            }
        });
    }

    createSubmissionTrendsChart() {
        const ctx = document.getElementById('submissionTrendsChart');
        if (!ctx) return;

        if (this.charts.trends) {
            this.charts.trends.destroy();
        }

        const trendsData = this.getSubmissionTrends();
        
        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendsData.labels,
                datasets: [{
                    label: 'Submissions',
                    data: trendsData.data,
                    borderColor: '#2DD4BF',
                    backgroundColor: 'rgba(45, 212, 191, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Submission Trends (Last 30 Days)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createBenefitsChart() {
        const ctx = document.getElementById('benefitsChart');
        if (!ctx) return;

        if (this.charts.benefits) {
            this.charts.benefits.destroy();
        }

        const benefitsData = this.getBenefitsDistribution();
        
        this.charts.benefits = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: benefitsData.labels,
                datasets: [{
                    label: 'Times Offered',
                    data: benefitsData.data,
                    backgroundColor: '#10B981'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Most Offered Benefits'
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    getIndustryDistribution() {
        const industryCount = {};
        
        this.diagnostics.forEach(diagnostic => {
            if (diagnostic.industry) {
                const industry = diagnostic.industry.trim();
                industryCount[industry] = (industryCount[industry] || 0) + 1;
            }
        });

        const sorted = Object.entries(industryCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8); // Top 8 industries

        return {
            labels: sorted.map(([industry]) => industry),
            data: sorted.map(([, count]) => count)
        };
    }

    getWorkTypeDistribution() {
        const workTypeCount = {};
        
        this.diagnostics.forEach(diagnostic => {
            if (diagnostic.workType) {
                const workType = diagnostic.workType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
                workTypeCount[workType] = (workTypeCount[workType] || 0) + 1;
            }
        });

        return {
            labels: Object.keys(workTypeCount),
            data: Object.values(workTypeCount)
        };
    }

    getExperienceLevelDistribution() {
        const experienceCount = {};
        
        this.diagnostics.forEach(diagnostic => {
            if (diagnostic.experienceLevel) {
                const level = diagnostic.experienceLevel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
                experienceCount[level] = (experienceCount[level] || 0) + 1;
            }
        });

        return {
            labels: Object.keys(experienceCount),
            data: Object.values(experienceCount)
        };
    }

    getSubmissionTrends() {
        const last30Days = Array.from({length: 30}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date;
        });

        const dailyCounts = last30Days.map(date => {
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
            
            return this.diagnostics.filter(diagnostic => {
                const submittedDate = new Date(diagnostic.submittedAt);
                return submittedDate >= dayStart && submittedDate < dayEnd;
            }).length;
        });

        return {
            labels: last30Days.map(date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            data: dailyCounts
        };
    }

    getBenefitsDistribution() {
        const benefitsCount = {};
        
        this.diagnostics.forEach(diagnostic => {
            if (diagnostic.benefits && Array.isArray(diagnostic.benefits)) {
                diagnostic.benefits.forEach(benefit => {
                    const formattedBenefit = benefit.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
                    benefitsCount[formattedBenefit] = (benefitsCount[formattedBenefit] || 0) + 1;
                });
            }
        });

        const sorted = Object.entries(benefitsCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10); // Top 10 benefits

        return {
            labels: sorted.map(([benefit]) => benefit),
            data: sorted.map(([, count]) => count)
        };
    }

    async exportAnalytics() {
        try {
            const analyticsData = this.prepareAnalyticsExport();
            Utils.exportToExcel(analyticsData, 'employer-diagnostics-analytics.xlsx');
            Utils.showSuccess('Analytics exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            Utils.showError('Failed to export analytics');
        }
    }

    prepareAnalyticsExport() {
        const stats = this.calculateStatistics();
        
        return {
            'Summary Statistics': [
                ['Total Submissions', stats.totalSubmissions],
                ['Today\'s Submissions', stats.todaySubmissions],
                ['This Week\'s Submissions', stats.weekSubmissions],
                ['Average Positions Offered', stats.avgPositionsOffered],
                ['Top Industry', stats.topIndustry],
                ['Full-time Jobs', stats.fullTimeJobs],
                ['Remote Jobs', stats.remoteJobs],
                ['Entry-level Jobs', stats.entryLevelJobs]
            ],
            'Industry Distribution': this.getIndustryDistribution().labels.map((label, index) => [
                label, 
                this.getIndustryDistribution().data[index]
            ]),
            'Work Type Distribution': this.getWorkTypeDistribution().labels.map((label, index) => [
                label, 
                this.getWorkTypeDistribution().data[index]
            ]),
            'Raw Data': this.diagnostics.map(diagnostic => ({
                'Company Name': diagnostic.companyName || '',
                'Industry': diagnostic.industry || '',
                'Job Title': diagnostic.jobTitle || '',
                'Positions Available': diagnostic.positionsAvailable || '',
                'Work Type': diagnostic.workType || '',
                'Work Mode': diagnostic.workMode || '',
                'Experience Level': diagnostic.experienceLevel || '',
                'Salary Range': diagnostic.salaryRange || '',
                'Submitted At': new Date(diagnostic.submittedAt).toLocaleDateString()
            }))
        };
    }

    refreshAnalytics() {
        // This would typically reload data from Firebase
        this.updateDashboard();
        Utils.showSuccess('Analytics refreshed');
    }

    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.employerAnalytics = new EmployerAnalytics();
});