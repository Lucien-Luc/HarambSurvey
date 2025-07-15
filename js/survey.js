// Survey Taking Interface
class SurveyInterface {
    constructor() {
        this.currentSurvey = null;
        this.currentQuestionIndex = 0;
        this.responses = {};
        this.isSubmitting = false;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        // Survey form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'surveyForm') {
                e.preventDefault();
                this.submitSurvey();
            }
        });
        
        // Survey navigation
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('survey-next')) {
                this.nextQuestion();
            } else if (e.target.classList.contains('survey-prev')) {
                this.prevQuestion();
            } else if (e.target.classList.contains('survey-submit')) {
                this.submitSurvey();
            }
        });
        
        // Real-time response tracking
        document.addEventListener('input', (e) => {
            if (e.target.closest('.survey-form')) {
                this.updateResponse(e.target);
            }
        });
        
        document.addEventListener('change', (e) => {
            if (e.target.closest('.survey-form')) {
                this.updateResponse(e.target);
                this.evaluateSkipLogic();
            }
        });
    }
    
    loadSurvey(survey) {
        this.currentSurvey = survey;
        this.currentQuestionIndex = 0;
        this.responses = {};
        
        this.renderSurvey();
    }
    
    renderSurvey() {
        if (!this.currentSurvey) return;
        
        // Update survey header
        document.getElementById('surveyTitle').textContent = this.currentSurvey.title;
        document.getElementById('surveyDescription').textContent = this.currentSurvey.description || '';
        
        // Render questions
        this.renderQuestions();
    }
    
    renderQuestions() {
        const surveyForm = document.getElementById('surveyForm');
        if (!surveyForm || !this.currentSurvey.questions) return;
        
        let formHtml = '<form id="surveyQuestionsForm">';
        
        // Progress bar
        formHtml += `
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        `;
        
        // Questions
        this.currentSurvey.questions.forEach((question, index) => {
            formHtml += this.renderQuestion(question, index);
        });
        
        // Navigation
        formHtml += this.renderNavigation();
        formHtml += '</form>';
        
        surveyForm.innerHTML = formHtml;
        
        // Show first question
        this.showQuestion(0);
        this.updateProgress();
    }
    
    renderQuestion(question, index) {
        const isVisible = index === 0 ? '' : 'style="display: none;"';
        
        let questionHtml = `
            <div class="question-container" data-question-index="${index}" data-question-id="${question.id}" ${isVisible}>
                <div class="question-title">
                    ${Utils.sanitizeHtml(question.title)}
                    ${question.required ? '<span class="question-required">*</span>' : ''}
                </div>
        `;
        
        if (question.description) {
            questionHtml += `<div class="question-description">${Utils.sanitizeHtml(question.description)}</div>`;
        }
        
        questionHtml += this.renderQuestionInput(question);
        questionHtml += '</div>';
        
        return questionHtml;
    }
    
    renderQuestionInput(question) {
        const name = question.id;
        let inputHtml = '';
        
        switch (question.type) {
            case 'text':
                inputHtml = `
                    <input type="text" 
                           class="form-control" 
                           name="${name}" 
                           id="${name}"
                           placeholder="${question.placeholder || ''}"
                           ${question.required ? 'required' : ''}>
                `;
                break;
                
            case 'textarea':
                inputHtml = `
                    <textarea class="form-control" 
                              name="${name}" 
                              id="${name}"
                              placeholder="${question.placeholder || ''}"
                              ${question.required ? 'required' : ''}></textarea>
                `;
                break;
                
            case 'email':
                inputHtml = `
                    <input type="email" 
                           class="form-control" 
                           name="${name}" 
                           id="${name}"
                           placeholder="${question.placeholder || 'Enter your email'}"
                           ${question.required ? 'required' : ''}>
                `;
                break;
                
            case 'number':
                inputHtml = `
                    <input type="number" 
                           class="form-control" 
                           name="${name}" 
                           id="${name}"
                           placeholder="${question.placeholder || ''}"
                           ${question.min !== undefined ? `min="${question.min}"` : ''}
                           ${question.max !== undefined ? `max="${question.max}"` : ''}
                           ${question.required ? 'required' : ''}>
                `;
                break;
                
            case 'date':
                inputHtml = `
                    <input type="date" 
                           class="form-control" 
                           name="${name}" 
                           id="${name}"
                           ${question.required ? 'required' : ''}>
                `;
                break;
                
            case 'radio':
                if (question.options && question.options.length > 0) {
                    inputHtml = '<div class="radio-group">';
                    question.options.forEach((option, index) => {
                        const optionValue = typeof option === 'object' ? option.value : option;
                        const optionLabel = typeof option === 'object' ? option.label : option;
                        inputHtml += `
                            <div class="radio-option">
                                <input type="radio" 
                                       name="${name}" 
                                       id="${name}_${index}" 
                                       value="${Utils.sanitizeHtml(optionValue)}"
                                       ${question.required ? 'required' : ''}>
                                <label for="${name}_${index}">${Utils.sanitizeHtml(optionLabel)}</label>
                            </div>
                        `;
                    });
                    inputHtml += '</div>';
                }
                break;
                
            case 'checkbox':
                if (question.options && question.options.length > 0) {
                    inputHtml = '<div class="checkbox-group">';
                    question.options.forEach((option, index) => {
                        const optionValue = typeof option === 'object' ? option.value : option;
                        const optionLabel = typeof option === 'object' ? option.label : option;
                        inputHtml += `
                            <div class="checkbox-option">
                                <input type="checkbox" 
                                       name="${name}" 
                                       id="${name}_${index}" 
                                       value="${Utils.sanitizeHtml(optionValue)}">
                                <label for="${name}_${index}">${Utils.sanitizeHtml(optionLabel)}</label>
                            </div>
                        `;
                    });
                    inputHtml += '</div>';
                }
                break;
                
            case 'select':
                if (question.options && question.options.length > 0) {
                    inputHtml = `<select class="form-control form-select" name="${name}" id="${name}" ${question.required ? 'required' : ''}>`;
                    inputHtml += '<option value="">Select an option</option>';
                    question.options.forEach(option => {
                        const optionValue = typeof option === 'object' ? option.value : option;
                        const optionLabel = typeof option === 'object' ? option.label : option;
                        inputHtml += `<option value="${Utils.sanitizeHtml(optionValue)}">${Utils.sanitizeHtml(optionLabel)}</option>`;
                    });
                    inputHtml += '</select>';
                }
                break;
                
            case 'rating':
                const min = question.min || 1;
                const max = question.max || 5;
                const minLabel = question.minLabel || 'Poor';
                const maxLabel = question.maxLabel || 'Excellent';
                
                inputHtml = '<div class="rating-scale">';
                for (let i = min; i <= max; i++) {
                    let label = i.toString();
                    if (i === min) label += ` (${minLabel})`;
                    if (i === max) label += ` (${maxLabel})`;
                    
                    inputHtml += `
                        <div class="rating-option">
                            <input type="radio" 
                                   name="${name}" 
                                   id="${name}_${i}" 
                                   value="${i}"
                                   ${question.required ? 'required' : ''}>
                            <label for="${name}_${i}">${label}</label>
                        </div>
                    `;
                }
                inputHtml += '</div>';
                break;
                
            default:
                inputHtml = `
                    <input type="text" 
                           class="form-control" 
                           name="${name}" 
                           id="${name}"
                           ${question.required ? 'required' : ''}>
                `;
        }
        
        return inputHtml;
    }
    
    renderNavigation() {
        return `
            <div class="survey-navigation">
                <button type="button" class="btn btn-outline survey-prev" style="display: none;">
                    <i class="fas fa-arrow-left"></i> Previous
                </button>
                <div class="question-counter">
                    <span id="currentQuestion">1</span> of <span id="totalQuestions">${this.currentSurvey.questions.length}</span>
                </div>
                <button type="button" class="btn btn-primary survey-next">
                    Next <i class="fas fa-arrow-right"></i>
                </button>
                <button type="button" class="btn btn-success survey-submit" style="display: none;">
                    <i class="fas fa-paper-plane"></i> Submit Survey
                </button>
            </div>
        `;
    }
    
    showQuestion(index) {
        if (!this.currentSurvey.questions || index < 0 || index >= this.currentSurvey.questions.length) {
            return;
        }
        
        // Hide all questions
        document.querySelectorAll('.question-container').forEach(container => {
            container.style.display = 'none';
        });
        
        // Show current question (considering skip logic)
        const visibleIndex = this.getNextVisibleQuestion(index);
        if (visibleIndex !== -1) {
            const questionContainer = document.querySelector(`[data-question-index="${visibleIndex}"]`);
            if (questionContainer) {
                questionContainer.style.display = 'block';
                this.currentQuestionIndex = visibleIndex;
            }
        }
        
        this.updateNavigation();
        this.updateProgress();
    }
    
    getNextVisibleQuestion(startIndex) {
        for (let i = startIndex; i < this.currentSurvey.questions.length; i++) {
            const question = this.currentSurvey.questions[i];
            if (this.shouldShowQuestion(question)) {
                return i;
            }
        }
        return -1;
    }
    
    shouldShowQuestion(question) {
        if (!question.skipLogic) return true;
        
        return Utils.evaluateSkipLogic(question.skipLogic, this.responses);
    }
    
    evaluateSkipLogic() {
        // Re-evaluate which questions should be visible
        const currentContainer = document.querySelector(`[data-question-index="${this.currentQuestionIndex}"]`);
        if (currentContainer && currentContainer.style.display === 'block') {
            // Current question is still visible, no need to change
            return;
        }
        
        // Find next visible question
        const nextVisible = this.getNextVisibleQuestion(this.currentQuestionIndex);
        if (nextVisible !== -1 && nextVisible !== this.currentQuestionIndex) {
            this.showQuestion(nextVisible);
        }
    }
    
    updateNavigation() {
        const prevBtn = document.querySelector('.survey-prev');
        const nextBtn = document.querySelector('.survey-next');
        const submitBtn = document.querySelector('.survey-submit');
        
        if (prevBtn) {
            prevBtn.style.display = this.currentQuestionIndex > 0 ? 'block' : 'none';
        }
        
        const isLastQuestion = this.currentQuestionIndex >= this.currentSurvey.questions.length - 1;
        
        if (nextBtn) {
            nextBtn.style.display = isLastQuestion ? 'none' : 'block';
        }
        
        if (submitBtn) {
            submitBtn.style.display = isLastQuestion ? 'block' : 'none';
        }
        
        // Update question counter
        const currentQuestionEl = document.getElementById('currentQuestion');
        if (currentQuestionEl) {
            currentQuestionEl.textContent = this.currentQuestionIndex + 1;
        }
    }
    
    updateProgress() {
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill && this.currentSurvey.questions) {
            const progress = ((this.currentQuestionIndex + 1) / this.currentSurvey.questions.length) * 100;
            progressFill.style.width = `${progress}%`;
        }
    }
    
    nextQuestion() {
        if (!this.validateCurrentQuestion()) {
            return;
        }
        
        const nextIndex = this.getNextVisibleQuestion(this.currentQuestionIndex + 1);
        if (nextIndex !== -1) {
            this.showQuestion(nextIndex);
        }
    }
    
    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            // Find previous visible question
            for (let i = this.currentQuestionIndex - 1; i >= 0; i--) {
                const question = this.currentSurvey.questions[i];
                if (this.shouldShowQuestion(question)) {
                    this.showQuestion(i);
                    break;
                }
            }
        }
    }
    
    validateCurrentQuestion() {
        const currentContainer = document.querySelector(`[data-question-index="${this.currentQuestionIndex}"]`);
        if (!currentContainer) return true;
        
        const questionId = currentContainer.dataset.questionId;
        const question = this.currentSurvey.questions.find(q => q.id === questionId);
        
        if (!question || !question.required) return true;
        
        const response = this.responses[questionId];
        
        if (!Utils.validateRequired(response)) {
            Utils.showError('Please answer this question before proceeding.');
            return false;
        }
        
        return true;
    }
    
    updateResponse(element) {
        const questionContainer = element.closest('.question-container');
        if (!questionContainer) return;
        
        const questionId = questionContainer.dataset.questionId;
        
        if (element.type === 'checkbox') {
            // Handle multiple values for checkboxes
            const checkboxes = questionContainer.querySelectorAll(`input[name="${element.name}"]:checked`);
            this.responses[questionId] = Array.from(checkboxes).map(cb => cb.value);
        } else if (element.type === 'radio') {
            this.responses[questionId] = element.value;
        } else {
            this.responses[questionId] = element.value;
        }
        
        // Save to local storage for recovery
        Utils.saveToStorage('survey_responses', {
            surveyId: this.currentSurvey.id,
            responses: this.responses,
            timestamp: new Date().toISOString()
        });
    }
    
    async submitSurvey() {
        if (this.isSubmitting) return;
        
        // Validate all required questions
        const validationErrors = this.validateAllQuestions();
        if (validationErrors.length > 0) {
            Utils.showError(`Please complete the following required questions: ${validationErrors.join(', ')}`);
            return;
        }
        
        this.isSubmitting = true;
        Utils.showLoading('Submitting your responses...');
        
        try {
            const responseData = {
                surveyId: this.currentSurvey.id,
                responses: this.responses,
                status: 'completed',
                submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
                deviceInfo: Utils.getDeviceInfo()
            };
            
            const result = await window.firebaseConfig.createDocument('responses', responseData);
            
            if (result.success) {
                this.showThankYou();
                Utils.removeFromStorage('survey_responses');
                Utils.showSuccess('Thank you for your response!');
            } else {
                Utils.showError('Failed to submit survey. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting survey:', error);
            Utils.showError('Failed to submit survey. Please try again.');
        } finally {
            this.isSubmitting = false;
            Utils.hideLoading();
        }
    }
    
    validateAllQuestions() {
        const errors = [];
        
        this.currentSurvey.questions.forEach(question => {
            if (question.required && this.shouldShowQuestion(question)) {
                const response = this.responses[question.id];
                if (!Utils.validateRequired(response)) {
                    errors.push(question.title);
                }
            }
        });
        
        return errors;
    }
    
    showThankYou() {
        const surveyForm = document.getElementById('surveyForm');
        if (surveyForm) {
            surveyForm.innerHTML = `
                <div class="survey-welcome">
                    <div class="welcome-icon" style="color: var(--color-success);">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h2>Thank You!</h2>
                    <p>Your response has been submitted successfully. We appreciate your participation.</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        Take Another Survey
                    </button>
                </div>
            `;
        }
    }
    
    // Recovery functionality
    recoverSavedResponse() {
        const saved = Utils.getFromStorage('survey_responses');
        if (saved && saved.surveyId === this.currentSurvey.id) {
            const timeDiff = Date.now() - new Date(saved.timestamp).getTime();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (timeDiff < maxAge) {
                this.responses = saved.responses;
                this.populateResponses();
                Utils.showMessage('Your previous responses have been restored.', 'info');
            }
        }
    }
    
    populateResponses() {
        Object.keys(this.responses).forEach(questionId => {
            const value = this.responses[questionId];
            const elements = document.querySelectorAll(`[name="${questionId}"]`);
            
            elements.forEach(element => {
                if (element.type === 'checkbox') {
                    element.checked = Array.isArray(value) && value.includes(element.value);
                } else if (element.type === 'radio') {
                    element.checked = element.value === value;
                } else {
                    element.value = value;
                }
            });
        });
    }
}

// Initialize survey interface
document.addEventListener('DOMContentLoaded', () => {
    window.survey = new SurveyInterface();
});
