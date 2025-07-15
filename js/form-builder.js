// Form Builder Interface
class FormBuilder {
    constructor() {
        this.currentSurvey = null;
        this.questions = [];
        this.draggedQuestionType = null;
        this.editingQuestionIndex = -1;
        this.isDirty = false;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.initDragAndDrop();
    }
    
    bindEvents() {
        // Form settings
        const formTitle = document.getElementById('formTitle');
        const formDescription = document.getElementById('formDescription');
        
        if (formTitle) {
            formTitle.addEventListener('input', this.updateFormSettings.bind(this));
        }
        
        if (formDescription) {
            formDescription.addEventListener('input', this.updateFormSettings.bind(this));
        }
        
        // Form actions
        const saveFormBtn = document.getElementById('saveFormBtn');
        const publishFormBtn = document.getElementById('publishFormBtn');
        const previewFormBtn = document.getElementById('previewFormBtn');
        
        if (saveFormBtn) {
            saveFormBtn.addEventListener('click', this.saveSurvey.bind(this));
        }
        
        if (publishFormBtn) {
            publishFormBtn.addEventListener('click', this.publishSurvey.bind(this));
        }
        
        if (previewFormBtn) {
            previewFormBtn.addEventListener('click', this.previewSurvey.bind(this));
        }
        
        // Question item actions
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-action="edit-question"]')) {
                this.editQuestion(parseInt(e.target.dataset.questionIndex));
            } else if (e.target.matches('[data-action="delete-question"]')) {
                this.deleteQuestion(parseInt(e.target.dataset.questionIndex));
            } else if (e.target.matches('[data-action="duplicate-question"]')) {
                this.duplicateQuestion(parseInt(e.target.dataset.questionIndex));
            } else if (e.target.matches('[data-action="move-up"]')) {
                this.moveQuestion(parseInt(e.target.dataset.questionIndex), -1);
            } else if (e.target.matches('[data-action="move-down"]')) {
                this.moveQuestion(parseInt(e.target.dataset.questionIndex), 1);
            }
        });
        
        // Auto-save
        setInterval(() => {
            if (this.isDirty && this.currentSurvey) {
                this.autoSave();
            }
        }, 30000); // Auto-save every 30 seconds
        
        // Warn before leaving if unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }
    
    initDragAndDrop() {
        // Make question types draggable
        const questionTypes = document.querySelectorAll('.question-type');
        questionTypes.forEach(type => {
            type.draggable = true;
            type.addEventListener('dragstart', this.handleDragStart.bind(this));
        });
        
        // Setup drop zone
        const questionsContainer = document.getElementById('questionsContainer');
        if (questionsContainer) {
            questionsContainer.addEventListener('dragover', this.handleDragOver.bind(this));
            questionsContainer.addEventListener('drop', this.handleDrop.bind(this));
        }
        
        // Also support click to add
        questionTypes.forEach(type => {
            type.addEventListener('click', this.handleQuestionTypeClick.bind(this));
        });
    }
    
    handleDragStart(e) {
        this.draggedQuestionType = e.target.dataset.type;
        e.dataTransfer.effectAllowed = 'copy';
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }
    
    handleDrop(e) {
        e.preventDefault();
        
        if (this.draggedQuestionType) {
            this.addQuestion(this.draggedQuestionType);
            this.draggedQuestionType = null;
        }
    }
    
    handleQuestionTypeClick(e) {
        const questionType = e.target.closest('.question-type').dataset.type;
        this.addQuestion(questionType);
    }
    
    addQuestion(type) {
        const newQuestion = this.createQuestionTemplate(type);
        this.questions.push(newQuestion);
        this.renderQuestions();
        this.markDirty();
        
        // Automatically open edit modal for new question
        this.editQuestion(this.questions.length - 1);
    }
    
    createQuestionTemplate(type) {
        const baseQuestion = {
            id: Utils.generateId(),
            type: type,
            title: this.getDefaultQuestionTitle(type),
            description: '',
            required: false,
            placeholder: '',
            skipLogic: null
        };
        
        // Add type-specific properties
        switch (type) {
            case 'radio':
            case 'checkbox':
            case 'select':
                baseQuestion.options = [
                    { label: 'Option 1', value: 'option1' },
                    { label: 'Option 2', value: 'option2' }
                ];
                break;
                
            case 'rating':
                baseQuestion.min = 1;
                baseQuestion.max = 5;
                baseQuestion.minLabel = 'Poor';
                baseQuestion.maxLabel = 'Excellent';
                break;
                
            case 'number':
                baseQuestion.min = undefined;
                baseQuestion.max = undefined;
                break;
        }
        
        return baseQuestion;
    }
    
    getDefaultQuestionTitle(type) {
        const titles = {
            'text': 'Short Text Question',
            'textarea': 'Long Text Question',
            'email': 'Email Address',
            'number': 'Number Question',
            'date': 'Date Question',
            'radio': 'Multiple Choice Question',
            'checkbox': 'Checkbox Question',
            'select': 'Dropdown Question',
            'rating': 'Rating Scale Question'
        };
        
        return titles[type] || 'Untitled Question';
    }
    
    renderQuestions() {
        const questionsContainer = document.getElementById('questionsContainer');
        if (!questionsContainer) return;
        
        if (this.questions.length === 0) {
            questionsContainer.innerHTML = `
                <div class="empty-form">
                    <i class="fas fa-plus-circle"></i>
                    <p>Drag question types here or click to add them to your form</p>
                </div>
            `;
            return;
        }
        
        const questionsHTML = this.questions.map((question, index) => 
            this.renderQuestionItem(question, index)
        ).join('');
        
        questionsContainer.innerHTML = questionsHTML;
    }
    
    renderQuestionItem(question, index) {
        return `
            <div class="question-item" data-question-index="${index}">
                <div class="question-item-header">
                    <div class="question-item-info">
                        <div class="question-item-title">${Utils.sanitizeHtml(question.title)}</div>
                        <div class="question-item-type">
                            <i class="fas fa-${this.getQuestionTypeIcon(question.type)}"></i>
                            ${this.getQuestionTypeLabel(question.type)}
                            ${question.required ? '<span class="required-badge">Required</span>' : ''}
                        </div>
                        ${question.description ? `<div class="question-item-description">${Utils.sanitizeHtml(question.description)}</div>` : ''}
                    </div>
                    <div class="question-item-actions">
                        <button type="button" data-action="move-up" data-question-index="${index}" 
                                ${index === 0 ? 'disabled' : ''} title="Move Up">
                            <i class="fas fa-arrow-up"></i>
                        </button>
                        <button type="button" data-action="move-down" data-question-index="${index}" 
                                ${index === this.questions.length - 1 ? 'disabled' : ''} title="Move Down">
                            <i class="fas fa-arrow-down"></i>
                        </button>
                        <button type="button" data-action="edit-question" data-question-index="${index}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" data-action="duplicate-question" data-question-index="${index}" title="Duplicate">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button type="button" data-action="delete-question" data-question-index="${index}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="question-item-preview">
                    ${this.renderQuestionPreview(question)}
                </div>
                
                ${question.skipLogic ? this.renderSkipLogicIndicator(question.skipLogic) : ''}
            </div>
        `;
    }
    
    getQuestionTypeIcon(type) {
        const icons = {
            'text': 'font',
            'textarea': 'align-left',
            'email': 'envelope',
            'number': 'hashtag',
            'date': 'calendar',
            'radio': 'dot-circle',
            'checkbox': 'check-square',
            'select': 'list',
            'rating': 'star'
        };
        
        return icons[type] || 'question';
    }
    
    getQuestionTypeLabel(type) {
        const labels = {
            'text': 'Text Input',
            'textarea': 'Long Text',
            'email': 'Email',
            'number': 'Number',
            'date': 'Date',
            'radio': 'Multiple Choice',
            'checkbox': 'Checkboxes',
            'select': 'Dropdown',
            'rating': 'Rating Scale'
        };
        
        return labels[type] || 'Unknown';
    }
    
    renderQuestionPreview(question) {
        switch (question.type) {
            case 'text':
            case 'email':
            case 'number':
            case 'date':
                return `<input type="${question.type}" class="form-control" placeholder="${question.placeholder || ''}" disabled>`;
                
            case 'textarea':
                return `<textarea class="form-control" placeholder="${question.placeholder || ''}" disabled></textarea>`;
                
            case 'radio':
                if (question.options && question.options.length > 0) {
                    return `
                        <div class="radio-group">
                            ${question.options.map(option => `
                                <div class="radio-option">
                                    <input type="radio" disabled>
                                    <label>${Utils.sanitizeHtml(option.label)}</label>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
                break;
                
            case 'checkbox':
                if (question.options && question.options.length > 0) {
                    return `
                        <div class="checkbox-group">
                            ${question.options.map(option => `
                                <div class="checkbox-option">
                                    <input type="checkbox" disabled>
                                    <label>${Utils.sanitizeHtml(option.label)}</label>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
                break;
                
            case 'select':
                if (question.options && question.options.length > 0) {
                    return `
                        <select class="form-control form-select" disabled>
                            <option>Select an option</option>
                            ${question.options.map(option => `
                                <option>${Utils.sanitizeHtml(option.label)}</option>
                            `).join('')}
                        </select>
                    `;
                }
                break;
                
            case 'rating':
                const min = question.min || 1;
                const max = question.max || 5;
                return `
                    <div class="rating-scale">
                        ${Array.from({length: max - min + 1}, (_, i) => i + min).map(num => `
                            <div class="rating-option">
                                <input type="radio" disabled>
                                <label>${num}</label>
                            </div>
                        `).join('')}
                    </div>
                `;
        }
        
        return '<p class="text-muted">Preview not available</p>';
    }
    
    renderSkipLogicIndicator(skipLogic) {
        return `
            <div class="skip-logic-indicator">
                <i class="fas fa-code-branch"></i>
                Skip logic: Show when ${skipLogic.field} ${skipLogic.operator} ${skipLogic.value}
            </div>
        `;
    }
    
    editQuestion(index) {
        if (index < 0 || index >= this.questions.length) return;
        
        this.editingQuestionIndex = index;
        const question = this.questions[index];
        
        this.showQuestionEditModal(question);
    }
    
    showQuestionEditModal(question) {
        const modalTitle = document.getElementById('questionModalTitle');
        const modalContent = document.getElementById('questionModalContent');
        
        if (modalTitle) {
            modalTitle.textContent = 'Edit Question';
        }
        
        if (modalContent) {
            modalContent.innerHTML = this.generateQuestionEditForm(question);
        }
        
        Utils.showModal('questionModal');
        
        // Bind form events
        this.bindQuestionEditEvents();
    }
    
    generateQuestionEditForm(question) {
        return `
            <form id="questionEditForm">
                <div class="form-group">
                    <label for="questionTitle">Question Title *</label>
                    <input type="text" id="questionTitle" class="form-control" value="${Utils.sanitizeHtml(question.title)}" required>
                </div>
                
                <div class="form-group">
                    <label for="questionDescription">Description (Optional)</label>
                    <textarea id="questionDescription" class="form-control">${Utils.sanitizeHtml(question.description || '')}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="questionPlaceholder">Placeholder Text</label>
                    <input type="text" id="questionPlaceholder" class="form-control" value="${Utils.sanitizeHtml(question.placeholder || '')}">
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="questionRequired" ${question.required ? 'checked' : ''}>
                        Required Question
                    </label>
                </div>
                
                ${this.generateTypeSpecificFields(question)}
                
                <div class="form-group">
                    <label>Skip Logic</label>
                    <div class="skip-logic-section">
                        <label>
                            <input type="checkbox" id="enableSkipLogic" ${question.skipLogic ? 'checked' : ''}>
                            Enable conditional display
                        </label>
                        <div id="skipLogicFields" style="display: ${question.skipLogic ? 'block' : 'none'};">
                            ${this.generateSkipLogicFields(question)}
                        </div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="Utils.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Question</button>
                </div>
            </form>
        `;
    }
    
    generateTypeSpecificFields(question) {
        switch (question.type) {
            case 'radio':
            case 'checkbox':
            case 'select':
                return this.generateOptionsFields(question);
                
            case 'rating':
                return this.generateRatingFields(question);
                
            case 'number':
                return this.generateNumberFields(question);
                
            default:
                return '';
        }
    }
    
    generateOptionsFields(question) {
        return `
            <div class="form-group">
                <label>Options</label>
                <div id="optionsList">
                    ${question.options ? question.options.map((option, index) => `
                        <div class="option-item">
                            <input type="text" class="form-control option-label" value="${Utils.sanitizeHtml(option.label)}" placeholder="Option label">
                            <input type="text" class="form-control option-value" value="${Utils.sanitizeHtml(option.value)}" placeholder="Option value">
                            <button type="button" class="btn btn-sm btn-outline remove-option">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('') : ''}
                </div>
                <button type="button" class="btn btn-sm btn-outline" id="addOption">
                    <i class="fas fa-plus"></i> Add Option
                </button>
            </div>
        `;
    }
    
    generateRatingFields(question) {
        return `
            <div class="form-group">
                <label for="ratingMin">Minimum Value</label>
                <input type="number" id="ratingMin" class="form-control" value="${question.min || 1}" min="1">
            </div>
            
            <div class="form-group">
                <label for="ratingMax">Maximum Value</label>
                <input type="number" id="ratingMax" class="form-control" value="${question.max || 5}" min="2">
            </div>
            
            <div class="form-group">
                <label for="ratingMinLabel">Minimum Label</label>
                <input type="text" id="ratingMinLabel" class="form-control" value="${Utils.sanitizeHtml(question.minLabel || '')}" placeholder="e.g., Poor">
            </div>
            
            <div class="form-group">
                <label for="ratingMaxLabel">Maximum Label</label>
                <input type="text" id="ratingMaxLabel" class="form-control" value="${Utils.sanitizeHtml(question.maxLabel || '')}" placeholder="e.g., Excellent">
            </div>
        `;
    }
    
    generateNumberFields(question) {
        return `
            <div class="form-group">
                <label for="numberMin">Minimum Value (Optional)</label>
                <input type="number" id="numberMin" class="form-control" value="${question.min || ''}" placeholder="No minimum">
            </div>
            
            <div class="form-group">
                <label for="numberMax">Maximum Value (Optional)</label>
                <input type="number" id="numberMax" class="form-control" value="${question.max || ''}" placeholder="No maximum">
            </div>
        `;
    }
    
    generateSkipLogicFields(question) {
        const availableFields = this.questions
            .filter((_, index) => index < this.editingQuestionIndex)
            .map(q => ({ id: q.id, title: q.title }));
        
        if (availableFields.length === 0) {
            return '<p class="text-muted">No previous questions available for skip logic</p>';
        }
        
        return `
            <div class="skip-logic-controls">
                <div class="form-group">
                    <label for="skipLogicField">Show this question when</label>
                    <select id="skipLogicField" class="form-control">
                        <option value="">Select a question</option>
                        ${availableFields.map(field => `
                            <option value="${field.id}" ${question.skipLogic?.field === field.id ? 'selected' : ''}>
                                ${Utils.sanitizeHtml(field.title)}
                            </option>
                        `).join('')}
                    </select>
                </div>
                
                <div class="form-group">
                    <select id="skipLogicOperator" class="form-control">
                        <option value="equals" ${question.skipLogic?.operator === 'equals' ? 'selected' : ''}>equals</option>
                        <option value="not_equals" ${question.skipLogic?.operator === 'not_equals' ? 'selected' : ''}>does not equal</option>
                        <option value="contains" ${question.skipLogic?.operator === 'contains' ? 'selected' : ''}>contains</option>
                        <option value="greater_than" ${question.skipLogic?.operator === 'greater_than' ? 'selected' : ''}>is greater than</option>
                        <option value="less_than" ${question.skipLogic?.operator === 'less_than' ? 'selected' : ''}>is less than</option>
                        <option value="is_empty" ${question.skipLogic?.operator === 'is_empty' ? 'selected' : ''}>is empty</option>
                        <option value="is_not_empty" ${question.skipLogic?.operator === 'is_not_empty' ? 'selected' : ''}>is not empty</option>
                    </select>
                </div>
                
                <div class="form-group" id="skipLogicValueGroup">
                    <input type="text" id="skipLogicValue" class="form-control" 
                           value="${question.skipLogic?.value || ''}" placeholder="Value">
                </div>
            </div>
        `;
    }
    
    bindQuestionEditEvents() {
        const form = document.getElementById('questionEditForm');
        if (!form) return;
        
        // Form submission
        form.addEventListener('submit', this.saveQuestionEdit.bind(this));
        
        // Add option button
        const addOptionBtn = document.getElementById('addOption');
        if (addOptionBtn) {
            addOptionBtn.addEventListener('click', this.addOption.bind(this));
        }
        
        // Remove option buttons
        form.addEventListener('click', (e) => {
            if (e.target.matches('.remove-option') || e.target.closest('.remove-option')) {
                e.target.closest('.option-item').remove();
            }
        });
        
        // Skip logic toggle
        const enableSkipLogic = document.getElementById('enableSkipLogic');
        if (enableSkipLogic) {
            enableSkipLogic.addEventListener('change', (e) => {
                const skipLogicFields = document.getElementById('skipLogicFields');
                if (skipLogicFields) {
                    skipLogicFields.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        }
        
        // Skip logic operator change
        const skipLogicOperator = document.getElementById('skipLogicOperator');
        if (skipLogicOperator) {
            skipLogicOperator.addEventListener('change', this.updateSkipLogicValueField.bind(this));
        }
    }
    
    addOption() {
        const optionsList = document.getElementById('optionsList');
        if (!optionsList) return;
        
        const optionItem = document.createElement('div');
        optionItem.className = 'option-item';
        optionItem.innerHTML = `
            <input type="text" class="form-control option-label" placeholder="Option label">
            <input type="text" class="form-control option-value" placeholder="Option value">
            <button type="button" class="btn btn-sm btn-outline remove-option">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        optionsList.appendChild(optionItem);
    }
    
    updateSkipLogicValueField() {
        const operator = document.getElementById('skipLogicOperator')?.value;
        const valueGroup = document.getElementById('skipLogicValueGroup');
        
        if (!valueGroup) return;
        
        if (operator === 'is_empty' || operator === 'is_not_empty') {
            valueGroup.style.display = 'none';
        } else {
            valueGroup.style.display = 'block';
        }
    }
    
    saveQuestionEdit(e) {
        e.preventDefault();
        
        if (this.editingQuestionIndex < 0) return;
        
        const formData = new FormData(e.target);
        const question = this.questions[this.editingQuestionIndex];
        
        // Update basic properties
        question.title = document.getElementById('questionTitle').value.trim();
        question.description = document.getElementById('questionDescription').value.trim();
        question.placeholder = document.getElementById('questionPlaceholder').value.trim();
        question.required = document.getElementById('questionRequired').checked;
        
        // Update type-specific properties
        this.updateTypeSpecificProperties(question);
        
        // Update skip logic
        this.updateSkipLogic(question);
        
        // Re-render questions
        this.renderQuestions();
        this.markDirty();
        
        // Close modal
        Utils.hideModal();
        
        Utils.showSuccess('Question updated successfully');
    }
    
    updateTypeSpecificProperties(question) {
        switch (question.type) {
            case 'radio':
            case 'checkbox':
            case 'select':
                this.updateOptionsFromForm(question);
                break;
                
            case 'rating':
                question.min = parseInt(document.getElementById('ratingMin')?.value) || 1;
                question.max = parseInt(document.getElementById('ratingMax')?.value) || 5;
                question.minLabel = document.getElementById('ratingMinLabel')?.value.trim() || '';
                question.maxLabel = document.getElementById('ratingMaxLabel')?.value.trim() || '';
                break;
                
            case 'number':
                const minVal = document.getElementById('numberMin')?.value;
                const maxVal = document.getElementById('numberMax')?.value;
                question.min = minVal ? parseInt(minVal) : undefined;
                question.max = maxVal ? parseInt(maxVal) : undefined;
                break;
        }
    }
    
    updateOptionsFromForm(question) {
        const optionItems = document.querySelectorAll('.option-item');
        question.options = Array.from(optionItems).map(item => {
            const label = item.querySelector('.option-label').value.trim();
            const value = item.querySelector('.option-value').value.trim() || Utils.slugify(label);
            
            return { label, value };
        }).filter(option => option.label); // Remove empty options
    }
    
    updateSkipLogic(question) {
        const enableSkipLogic = document.getElementById('enableSkipLogic')?.checked;
        
        if (!enableSkipLogic) {
            question.skipLogic = null;
            return;
        }
        
        const field = document.getElementById('skipLogicField')?.value;
        const operator = document.getElementById('skipLogicOperator')?.value;
        const value = document.getElementById('skipLogicValue')?.value;
        
        if (field && operator) {
            question.skipLogic = {
                field,
                operator,
                value: operator === 'is_empty' || operator === 'is_not_empty' ? '' : value
            };
        } else {
            question.skipLogic = null;
        }
    }
    
    deleteQuestion(index) {
        if (index < 0 || index >= this.questions.length) return;
        
        const question = this.questions[index];
        
        if (!confirm(`Are you sure you want to delete "${question.title}"?`)) {
            return;
        }
        
        this.questions.splice(index, 1);
        this.renderQuestions();
        this.markDirty();
        
        Utils.showSuccess('Question deleted successfully');
    }
    
    duplicateQuestion(index) {
        if (index < 0 || index >= this.questions.length) return;
        
        const question = this.questions[index];
        const duplicatedQuestion = {
            ...question,
            id: Utils.generateId(),
            title: `${question.title} (Copy)`
        };
        
        this.questions.splice(index + 1, 0, duplicatedQuestion);
        this.renderQuestions();
        this.markDirty();
        
        Utils.showSuccess('Question duplicated successfully');
    }
    
    moveQuestion(index, direction) {
        if (index < 0 || index >= this.questions.length) return;
        
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.questions.length) return;
        
        // Swap questions
        [this.questions[index], this.questions[newIndex]] = [this.questions[newIndex], this.questions[index]];
        
        this.renderQuestions();
        this.markDirty();
    }
    
    updateFormSettings() {
        this.markDirty();
    }
    
    markDirty() {
        this.isDirty = true;
        this.updateSaveButton();
    }
    
    markClean() {
        this.isDirty = false;
        this.updateSaveButton();
    }
    
    updateSaveButton() {
        const saveBtn = document.getElementById('saveFormBtn');
        if (saveBtn) {
            if (this.isDirty) {
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save*';
                saveBtn.classList.add('btn-warning');
                saveBtn.classList.remove('btn-success');
            } else {
                saveBtn.innerHTML = '<i class="fas fa-save"></i> Save';
                saveBtn.classList.remove('btn-warning');
                saveBtn.classList.add('btn-success');
            }
        }
    }
    
    async saveSurvey() {
        const title = document.getElementById('formTitle')?.value.trim();
        const description = document.getElementById('formDescription')?.value.trim();
        
        if (!title) {
            Utils.showError('Please enter a survey title');
            return;
        }
        
        if (this.questions.length === 0) {
            Utils.showError('Please add at least one question');
            return;
        }
        
        Utils.showLoading('Saving survey...');
        
        try {
            const surveyData = {
                title,
                description,
                questions: this.questions,
                status: this.currentSurvey?.status || 'draft'
            };
            
            let result;
            if (this.currentSurvey?.id) {
                // Update existing survey
                result = await window.firebaseConfig.updateDocument('surveys', this.currentSurvey.id, surveyData);
            } else {
                // Create new survey
                result = await window.firebaseConfig.createDocument('surveys', surveyData);
                if (result.success) {
                    this.currentSurvey = { id: result.id, ...surveyData };
                }
            }
            
            if (result.success) {
                this.markClean();
                Utils.showSuccess('Survey saved successfully');
            } else {
                Utils.showError('Failed to save survey');
            }
        } catch (error) {
            console.error('Error saving survey:', error);
            Utils.showError('Failed to save survey');
        } finally {
            Utils.hideLoading();
        }
    }
    
    async publishSurvey() {
        // Save first
        await this.saveSurvey();
        
        if (!this.currentSurvey?.id) {
            Utils.showError('Please save the survey first');
            return;
        }
        
        Utils.showLoading('Publishing survey...');
        
        try {
            const result = await window.firebaseConfig.updateDocument('surveys', this.currentSurvey.id, {
                status: 'active'
            });
            
            if (result.success) {
                this.currentSurvey.status = 'active';
                Utils.showSuccess('Survey published successfully');
                
                // Show survey link
                this.showSurveyLink();
            } else {
                Utils.showError('Failed to publish survey');
            }
        } catch (error) {
            console.error('Error publishing survey:', error);
            Utils.showError('Failed to publish survey');
        } finally {
            Utils.hideLoading();
        }
    }
    
    showSurveyLink() {
        const baseUrl = window.location.origin + window.location.pathname;
        const surveyUrl = `${baseUrl}?survey=${this.currentSurvey.id}`;
        
        const modalContent = `
            <div class="survey-link-modal">
                <h4>Survey Published!</h4>
                <p>Your survey is now live and ready to collect responses.</p>
                
                <div class="form-group">
                    <label>Survey Link</label>
                    <div class="input-group">
                        <input type="text" class="form-control" value="${surveyUrl}" readonly id="surveyLinkInput">
                        <button class="btn btn-outline" onclick="formBuilder.copySurveyLink()">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                </div>
                
                <div class="survey-link-actions">
                    <button class="btn btn-primary" onclick="window.open('${surveyUrl}', '_blank')">
                        <i class="fas fa-external-link-alt"></i> Open Survey
                    </button>
                    <button class="btn btn-outline" onclick="Utils.hideModal()">Close</button>
                </div>
            </div>
        `;
        
        document.getElementById('questionModalTitle').textContent = 'Survey Published';
        document.getElementById('questionModalContent').innerHTML = modalContent;
        Utils.showModal('questionModal');
    }
    
    async copySurveyLink() {
        const input = document.getElementById('surveyLinkInput');
        if (input) {
            const success = await Utils.copyToClipboard(input.value);
            if (success) {
                Utils.showSuccess('Survey link copied to clipboard');
            } else {
                Utils.showError('Failed to copy link');
            }
        }
    }
    
    previewSurvey() {
        if (this.questions.length === 0) {
            Utils.showError('Add questions to preview the survey');
            return;
        }
        
        const title = document.getElementById('formTitle')?.value.trim() || 'Untitled Survey';
        const description = document.getElementById('formDescription')?.value.trim() || '';
        
        const previewSurvey = {
            id: 'preview',
            title,
            description,
            questions: this.questions,
            status: 'preview'
        };
        
        // Load preview in survey interface
        if (window.survey) {
            window.survey.loadSurvey(previewSurvey);
        }
        
        // Switch to survey view
        window.app.showView('surveyView');
        
        Utils.showMessage('Preview mode - responses will not be saved', 'warning');
    }
    
    async autoSave() {
        if (!this.currentSurvey?.id) return;
        
        const title = document.getElementById('formTitle')?.value.trim();
        const description = document.getElementById('formDescription')?.value.trim();
        
        if (!title || this.questions.length === 0) return;
        
        try {
            const surveyData = {
                title,
                description,
                questions: this.questions
            };
            
            await window.firebaseConfig.updateDocument('surveys', this.currentSurvey.id, surveyData);
            this.markClean();
            
            // Show subtle auto-save indicator
            this.showAutoSaveIndicator();
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }
    
    showAutoSaveIndicator() {
        const saveBtn = document.getElementById('saveFormBtn');
        if (saveBtn) {
            const originalText = saveBtn.innerHTML;
            saveBtn.innerHTML = '<i class="fas fa-check"></i> Auto-saved';
            saveBtn.classList.add('btn-success');
            
            setTimeout(() => {
                saveBtn.innerHTML = originalText;
                this.updateSaveButton();
            }, 2000);
        }
    }
    
    loadSurvey(survey) {
        this.currentSurvey = survey;
        this.questions = survey.questions ? [...survey.questions] : [];
        
        // Update form fields
        const formTitle = document.getElementById('formTitle');
        const formDescription = document.getElementById('formDescription');
        const formBuilderTitle = document.getElementById('formBuilderTitle');
        
        if (formTitle) formTitle.value = survey.title || '';
        if (formDescription) formDescription.value = survey.description || '';
        if (formBuilderTitle) formBuilderTitle.textContent = survey.title ? `Edit: ${survey.title}` : 'Form Builder';
        
        this.renderQuestions();
        this.markClean();
    }
    
    reset() {
        this.currentSurvey = null;
        this.questions = [];
        this.editingQuestionIndex = -1;
        this.isDirty = false;
        
        // Clear form fields
        const formTitle = document.getElementById('formTitle');
        const formDescription = document.getElementById('formDescription');
        const formBuilderTitle = document.getElementById('formBuilderTitle');
        
        if (formTitle) formTitle.value = '';
        if (formDescription) formDescription.value = '';
        if (formBuilderTitle) formBuilderTitle.textContent = 'Form Builder';
        
        this.renderQuestions();
        this.markClean();
    }
}

// Initialize form builder
document.addEventListener('DOMContentLoaded', () => {
    window.formBuilder = new FormBuilder();
});
