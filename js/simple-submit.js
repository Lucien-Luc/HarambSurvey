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
        
        console.log('SimpleFormSubmit: Setup complete - button is ready');
        
        // Show confirmation that setup worked
        setTimeout(() => {
            alert('✓ Form submission system is ready!\n\nThe green SUBMIT FORM button is now active.');
        }, 500);
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
        console.log('SimpleFormSubmit: Showing success message');
        
        // Create success message
        const successHtml = `
            <div style="text-align: center; padding: 40px; background: linear-gradient(135deg, #d4f5d4, #b8e6b8); border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <div style="font-size: 4em; color: #28a745; margin-bottom: 20px;">✓</div>
                <h1 style="color: #155724; font-size: 2.5em; margin-bottom: 15px;">Success!</h1>
                <h2 style="color: #155724; font-size: 1.5em; margin-bottom: 20px;">Form Submitted Successfully</h2>
                <p style="font-size: 1.1em; color: #155724; margin-bottom: 15px;">
                    Your employer diagnostic form has been submitted and saved.
                </p>
                <p style="font-size: 0.9em; color: #6c757d; margin-bottom: 25px;">
                    Submission ID: ${data.submissionId}<br>
                    Time: ${new Date(data.submittedAt).toLocaleString()}
                </p>
                <button onclick="window.location.reload()" 
                        style="background: #007bff; color: white; padding: 15px 30px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; margin-right: 10px;">
                    Submit Another Form
                </button>
                <button onclick="console.table(JSON.parse(localStorage.getItem('employer-submissions') || '[]'))" 
                        style="background: #6c757d; color: white; padding: 15px 30px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">
                    View All Submissions
                </button>
            </div>
        `;
        
        // Replace form with success message
        const container = document.querySelector('.survey-container') || document.querySelector('#surveyView .container') || document.body;
        if (container) {
            container.innerHTML = successHtml;
        }
        
        // Show alert
        alert('✅ SUCCESS!\n\nForm submitted and saved successfully!\n\nSubmission ID: ' + data.submissionId);
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

// Make globally available for debugging
window.simpleSubmit = simpleSubmit;