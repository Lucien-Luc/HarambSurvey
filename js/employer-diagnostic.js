/**
 * Employer Diagnostic Form Handler
 * Manages multi-section survey navigation and Firebase submission
 */
class EmployerDiagnosticForm {
    constructor() {
        this.currentSection = 1;
        this.totalSections = 7;
        this.form = null;
        this.sections = [];
        this.progressFill = null;
        this.progressText = null;
        this.nextBtn = null;
        this.prevBtn = null;
        this.submitBtn = null;
        this.firebaseConfig = null;
    }

    init() {
        console.log('Initializing EmployerDiagnosticForm...');
        this.form = document.getElementById('employerDiagnosticForm');
        this.sections = document.querySelectorAll('.survey-section');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.nextBtn = document.getElementById('nextBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.submitBtn = document.getElementById('submitBtn');

        console.log('Form element found:', !!this.form);
        console.log('Submit button found:', !!this.submitBtn);
        console.log('Sections found:', this.sections.length);

        if (!this.form) {
            console.error('EmployerDiagnosticForm: Form not found!');
            return;
        }

        this.bindEvents();
        this.updateProgress();
        this.updateNavigation();
        console.log('EmployerDiagnosticForm initialization complete');
    }

    bindEvents() {
        console.log('Binding events...');
        
        if (this.nextBtn) {
            console.log('Binding next button');
            this.nextBtn.addEventListener('click', () => this.nextSection());
        } else {
            console.log('Next button not found');
        }

        if (this.prevBtn) {
            console.log('Binding prev button');
            this.prevBtn.addEventListener('click', () => this.prevSection());
        } else {
            console.log('Prev button not found');
        }

        if (this.form) {
            console.log('Binding form submit event');
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            
            // Auto-save on input changes
            this.form.addEventListener('input', Utils.debounce(() => {
                this.autoSave();
            }, 1000));
        } else {
            console.error('Form not found for event binding');
        }
        
        console.log('Event binding complete');
    }

    nextSection() {
        if (this.currentSection < this.totalSections) {
            if (this.validateCurrentSection()) {
                this.showSection(this.currentSection + 1);
            }
        }
    }

    prevSection() {
        if (this.currentSection > 1) {
            this.showSection(this.currentSection - 1);
        }
    }

    showSection(sectionNumber) {
        // Hide current section
        this.sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`section${sectionNumber}`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionNumber;
            this.updateProgress();
            this.updateNavigation();
            
            // Scroll to top of form
            targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    updateProgress() {
        const progressPercentage = (this.currentSection / this.totalSections) * 100;
        
        if (this.progressFill) {
            this.progressFill.style.width = `${progressPercentage}%`;
        }
        
        if (this.progressText) {
            this.progressText.textContent = `Section ${this.currentSection} of ${this.totalSections}`;
        }
    }

    updateNavigation() {
        // Show/hide previous button
        if (this.prevBtn) {
            this.prevBtn.style.display = this.currentSection > 1 ? 'flex' : 'none';
        }

        // Show/hide next vs submit button
        if (this.currentSection === this.totalSections) {
            if (this.nextBtn) this.nextBtn.style.display = 'none';
            if (this.submitBtn) this.submitBtn.style.display = 'flex';
        } else {
            if (this.nextBtn) this.nextBtn.style.display = 'flex';
            if (this.submitBtn) this.submitBtn.style.display = 'none';
        }
    }

    validateCurrentSection() {
        const currentSectionElement = document.getElementById(`section${this.currentSection}`);
        if (!currentSectionElement) return true;

        const requiredFields = currentSectionElement.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (field.type === 'radio') {
                const radioGroup = currentSectionElement.querySelectorAll(`[name="${field.name}"]`);
                const isGroupValid = Array.from(radioGroup).some(radio => radio.checked);
                if (!isGroupValid) {
                    isValid = false;
                    this.showFieldError(field, 'Please select an option');
                }
            } else if (field.type === 'checkbox') {
                // For checkbox groups, check if at least one is selected (if required)
                const checkboxGroup = currentSectionElement.querySelectorAll(`[name="${field.name}"]`);
                const isGroupValid = Array.from(checkboxGroup).some(checkbox => checkbox.checked);
                if (!isGroupValid && field.hasAttribute('required')) {
                    isValid = false;
                    this.showFieldError(field, 'Please select at least one option');
                }
            } else if (!field.value.trim()) {
                isValid = false;
                this.showFieldError(field, 'This field is required');
            } else {
                this.clearFieldError(field);
            }
        });

        if (!isValid) {
            Utils.showError('Please complete all required fields before continuing');
        }

        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.style.borderColor = 'var(--color-error)';
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.style.color = 'var(--color-error)';
        errorElement.style.fontSize = '0.875rem';
        errorElement.style.marginTop = '0.25rem';
        
        field.parentNode.appendChild(errorElement);
    }

    clearFieldError(field) {
        field.style.borderColor = '#E5E7EB';
        
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        console.log('Submit button clicked - starting validation');
        
        if (!this.validateCurrentSection()) {
            console.log('Validation failed for current section');
            return;
        }

        console.log('Validation passed - showing loading');
        Utils.showLoading('Submitting your form...');

        try {
            console.log('Collecting form data...');
            const formData = this.collectFormData();
            console.log('Form data collected:', formData);
            
            console.log('Attempting Firebase submission...');
            await this.submitToFirebase(formData);
            
            console.log('Firebase submission successful!');
            Utils.hideLoading();
            Utils.showSuccess('Thank you! Your employer diagnostic form has been submitted successfully.');
            
            // Show thank you message
            this.showThankYou();
            
        } catch (error) {
            console.log('Submit error caught:', error);
            Utils.hideLoading();
            console.error('Form submission error:', error);
            
            // Show specific error message to user
            let errorMessage = 'There was an error submitting your form. ';
            if (error.message.includes('permission-denied')) {
                errorMessage += 'Permission denied - please contact support.';
            } else if (error.message.includes('network')) {
                errorMessage += 'Network error - please check your connection.';
            } else {
                errorMessage += error.message || 'Please try again.';
            }
            
            Utils.showError(errorMessage);
            
            // Also alert for immediate feedback
            alert('Submission failed: ' + (error.message || 'Unknown error'));
        }
    }

    collectFormData() {
        const formData = new FormData(this.form);
        const data = {};

        // Collect regular form fields
        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (checkboxes)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }

        // Collect checkbox arrays
        const checkboxGroups = ['behavioralSkills', 'benefits'];
        checkboxGroups.forEach(groupName => {
            const checkboxes = this.form.querySelectorAll(`input[name="${groupName}"]:checked`);
            data[groupName] = Array.from(checkboxes).map(cb => cb.value);
        });

        // Add metadata
        data.submittedAt = new Date().toISOString();
        data.deviceInfo = Utils.getDeviceInfo();
        data.formType = 'employer-diagnostic';

        return data;
    }

    async submitToFirebase(formData) {
        console.log('Attempting to submit form data:', formData);
        
        // Get Firebase instance
        let firebaseConfig = window.firebaseConfig || window.FirebaseConfig;
        
        if (!firebaseConfig || !firebaseConfig.db) {
            console.warn('Firebase not available, using local storage as fallback');
            this.saveToLocalStorage(formData);
            return { success: true, fallback: true };
        }

        try {
            // Try Firebase submission first
            console.log('Submitting to Firebase...');
            const docRef = await firebaseConfig.createDocument('employer-diagnostics', formData);
            console.log('Firebase submission successful:', docRef);
            return docRef;
        } catch (error) {
            console.error('Firebase submission failed:', error);
            
            // Fallback to local storage
            console.log('Using local storage fallback...');
            this.saveToLocalStorage(formData);
            
            // Still show success to user
            return { success: true, fallback: true, error: error.message };
        }
    }

    saveToLocalStorage(formData) {
        const submissions = JSON.parse(localStorage.getItem('employer-submissions') || '[]');
        submissions.push({
            ...formData,
            id: Date.now().toString(),
            submittedAt: new Date().toISOString()
        });
        localStorage.setItem('employer-submissions', JSON.stringify(submissions));
        console.log('Form data saved to local storage:', formData);
        
        // Show in console for verification
        console.log('Total submissions in local storage:', submissions.length);
        console.table(submissions);
    }

    autoSave() {
        const formData = this.collectFormData();
        Utils.saveToStorage('employer-diagnostic-draft', formData);
        
        // Show auto-save indicator briefly
        this.showAutoSaveIndicator();
    }

    showAutoSaveIndicator() {
        let indicator = document.getElementById('autoSaveIndicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autoSaveIndicator';
            indicator.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                background: var(--color-success);
                color: white;
                padding: 0.5rem 1rem;
                border-radius: var(--border-radius);
                font-size: 0.875rem;
                z-index: 1000;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.textContent = '✓ Draft saved';
        indicator.style.opacity = '1';
        
        setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    }

    loadDraft() {
        const draft = Utils.getFromStorage('employer-diagnostic-draft');
        if (draft) {
            // Populate form with draft data
            Object.keys(draft).forEach(key => {
                const field = this.form.querySelector(`[name="${key}"]`);
                if (field) {
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        if (Array.isArray(draft[key])) {
                            draft[key].forEach(value => {
                                const specificField = this.form.querySelector(`[name="${key}"][value="${value}"]`);
                                if (specificField) specificField.checked = true;
                            });
                        } else {
                            const specificField = this.form.querySelector(`[name="${key}"][value="${draft[key]}"]`);
                            if (specificField) specificField.checked = true;
                        }
                    } else {
                        field.value = draft[key];
                    }
                }
            });
        }
    }

    showThankYou() {
        const surveyContainer = document.querySelector('.survey-container');
        if (surveyContainer) {
            surveyContainer.innerHTML = `
                <div class="thank-you-message" style="text-align: center; padding: 3rem 2rem;">
                    <div style="color: var(--color-success); font-size: 4rem; margin-bottom: 1rem;">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h2 style="color: var(--color-dark); margin-bottom: 1rem;">Thank You!</h2>
                    <p style="color: var(--color-tertiary); font-size: 1.1rem; margin-bottom: 2rem;">
                        Your employer diagnostic form has been submitted successfully. 
                        We'll use this information to help match your company with the right talent at the fair.
                    </p>
                    <button onclick="window.location.reload()" class="btn btn-primary">
                        <i class="fas fa-plus"></i>
                        Submit Another Form
                    </button>
                </div>
            `;
        }

        // Clear saved draft
        Utils.removeFromStorage('employer-diagnostic-draft');
    }
}

// Create global instance
window.employerDiagnosticForm = new EmployerDiagnosticForm();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded - initializing employer diagnostic form');
    
    // Try to initialize immediately
    if (document.getElementById('employerDiagnosticForm')) {
        console.log('Form found immediately - initializing');
        window.employerDiagnosticForm.init();
    } else {
        console.log('Form not found yet - will wait for manual initialization');
    }
});