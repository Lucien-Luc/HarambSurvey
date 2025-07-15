// Utility Functions
class Utils {
    // Device detection
    static getDeviceInfo() {
        const ua = navigator.userAgent;
        let device = 'Unknown';
        
        if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
            if (/iPad/i.test(ua)) {
                device = 'iPad';
            } else if (/iPhone/i.test(ua)) {
                device = 'iPhone';
            } else if (/Android/i.test(ua)) {
                device = 'Android';
            } else {
                device = 'Mobile';
            }
        } else {
            device = 'Desktop';
        }
        
        return {
            device,
            userAgent: ua,
            timestamp: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language
        };
    }
    
    // Date formatting
    static formatDate(date, format = 'full') {
        if (!date) return 'N/A';
        
        const d = date.toDate ? date.toDate() : new Date(date);
        
        switch (format) {
            case 'short':
                return d.toLocaleDateString();
            case 'time':
                return d.toLocaleTimeString();
            case 'datetime':
                return d.toLocaleString();
            case 'relative':
                return this.getRelativeTime(d);
            default:
                return d.toLocaleString();
        }
    }
    
    static getRelativeTime(date) {
        const now = new Date();
        const diff = now - date;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        
        return date.toLocaleDateString();
    }
    
    // String utilities
    static sanitizeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
    
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    static slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    }
    
    // Validation
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    static validateRequired(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    }
    
    // Excel export functionality
    static exportToExcel(data, filename = 'export.xlsx') {
        try {
            // Create workbook
            const wb = XLSX.utils.book_new();
            
            // Convert data to worksheet
            const ws = XLSX.utils.json_to_sheet(data);
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Data');
            
            // Save file
            XLSX.writeFile(wb, filename);
            
            return { success: true };
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Local storage utilities
    static saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            return false;
        }
    }
    
    static getFromStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error getting from storage:', error);
            return defaultValue;
        }
    }
    
    static removeFromStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from storage:', error);
            return false;
        }
    }
    
    // URL utilities
    static getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }
    
    static updateUrlParams(params, replace = false) {
        const url = new URL(window.location);
        
        Object.keys(params).forEach(key => {
            if (params[key] === null || params[key] === undefined) {
                url.searchParams.delete(key);
            } else {
                url.searchParams.set(key, params[key]);
            }
        });
        
        if (replace) {
            window.history.replaceState({}, '', url);
        } else {
            window.history.pushState({}, '', url);
        }
    }
    
    // Form utilities
    static serializeForm(form) {
        const formData = new FormData(form);
        const result = {};
        
        for (const [key, value] of formData) {
            if (result[key]) {
                // Handle multiple values (checkboxes)
                if (Array.isArray(result[key])) {
                    result[key].push(value);
                } else {
                    result[key] = [result[key], value];
                }
            } else {
                result[key] = value;
            }
        }
        
        return result;
    }
    
    static populateForm(form, data) {
        Object.keys(data).forEach(key => {
            const element = form.querySelector(`[name="${key}"]`);
            if (element) {
                if (element.type === 'checkbox' || element.type === 'radio') {
                    element.checked = element.value === data[key] || 
                                     (Array.isArray(data[key]) && data[key].includes(element.value));
                } else {
                    element.value = data[key];
                }
            }
        });
    }
    
    // Loading states
    static showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const messageEl = overlay.querySelector('p');
        
        if (messageEl) {
            messageEl.textContent = message;
        }
        
        overlay.classList.add('show');
    }
    
    static hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.remove('show');
    }
    
    // Messages and notifications
    static showMessage(message, type = 'info', duration = 5000) {
        const messageEl = document.createElement('div');
        messageEl.className = `message ${type}`;
        messageEl.textContent = message;
        
        // Add to top of main content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(messageEl, mainContent.firstChild);
            
            // Auto remove after duration
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, duration);
        }
    }
    
    static showError(message) {
        this.showMessage(message, 'error');
    }
    
    static showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    static showWarning(message) {
        this.showMessage(message, 'warning');
    }
    
    // Modal utilities
    static showModal(modalId) {
        const overlay = document.getElementById('modalOverlay');
        const modal = document.getElementById(modalId);
        
        if (overlay && modal) {
            overlay.classList.add('show');
            // Hide all modals first
            overlay.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
            // Show target modal
            modal.style.display = 'block';
        }
    }
    
    static hideModal() {
        const overlay = document.getElementById('modalOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }
    
    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Copy to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Error copying to clipboard:', error);
            return false;
        }
    }
    
    // Skip logic evaluation
    static evaluateSkipLogic(condition, responses) {
        if (!condition || !condition.field || !condition.operator || condition.value === undefined) {
            return true; // Show by default if no valid condition
        }
        
        const fieldValue = responses[condition.field];
        const conditionValue = condition.value;
        
        switch (condition.operator) {
            case 'equals':
                return fieldValue === conditionValue;
            case 'not_equals':
                return fieldValue !== conditionValue;
            case 'contains':
                return fieldValue && fieldValue.toString().includes(conditionValue);
            case 'greater_than':
                return parseFloat(fieldValue) > parseFloat(conditionValue);
            case 'less_than':
                return parseFloat(fieldValue) < parseFloat(conditionValue);
            case 'is_empty':
                return !fieldValue || fieldValue.toString().trim() === '';
            case 'is_not_empty':
                return fieldValue && fieldValue.toString().trim() !== '';
            default:
                return true;
        }
    }
}

// Make Utils available globally
window.Utils = Utils;
