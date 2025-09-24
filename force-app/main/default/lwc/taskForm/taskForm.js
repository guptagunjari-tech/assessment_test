import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createTask from '@salesforce/apex/TaskManagementController.createTask';
import generateAISummary from '@salesforce/apex/TaskAISummaryService.generateTaskSummary';

export default class TaskForm extends LightningElement {
    @api recordId;
    @track showModal = false;
    @track tags = [];
    @track isSaving = false;
    @track newTag = ''; 

    get modalTitle() {
        return this.recordId ? 'Edit Task' : 'New Task';
    }

    get tagsString() {
        return this.tags.join(', ');
    }

    handleNewClick() {
        this.recordId = null;
        this.tags = [];
        this.showModal = true;
    }

    handleClose() {
        this.showModal = false;
        this.resetForm();
    }
    
    handleSubmit(event) {
        event.preventDefault();
        const fields = event.detail.fields;

        if (fields.Title__c && /^\d/.test(fields.Title__c.trim())) {
            this.showToast('Error', 'Task Title cannot start with a number.', 'error');
            return;
        }
        if (fields.Due_Date__c) {
            const dueDate = new Date(fields.Due_Date__c);
            const today = new Date();
            today.setHours(0,0,0,0);
            if (dueDate < today) {
                this.showToast('Error', 'Due Date cannot be in the past.', 'error');
                return;
            }
        }

        this.isSaving = true;
        const task = { ...fields };

        createTask({ task, tags: this.tags })
            .then(result => {
                generateAISummary({ taskId: result.Id });
                this.showModal = false;
                this.resetForm();
                this.dispatchEvent(new CustomEvent('new'));
                this.showToast('Success', 'Task created successfully', 'success');
            })
            .catch(error => {
                const errorMessage = error.body?.message || error.message || 'An unexpected error occurred while creating the task';
                this.showToast('Error', errorMessage, 'error');
            })
            .finally(() => {
                this.isSaving = false;
            });
    }

    handleSuccess() {
        this.showModal = false;
        this.resetForm();
        this.dispatchEvent(new CustomEvent('refresh'));
    }

    handleError(event) {
        this.showToast('Error', event.detail.detail, 'error');
    }

    resetForm() {
        const form = this.template.querySelector('lightning-record-edit-form');
        this.tags = [];
        this.isSaving = false;
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );      
    }

handleNewTagChange(event) {
    this.newTag = event.target.value;
}

handleTagKeyDown(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        const newTagTrimmed = this.newTag.trim();
        if (newTagTrimmed && !this.tags.includes(newTagTrimmed)) {
            this.tags = [...this.tags, newTagTrimmed];
        }
        this.newTag = '';
    }
}

    handleRemoveTag(event) {
        const tagToRemove = event.target.label;
        this.tags = this.tags.filter(tag => tag !== tagToRemove);
    }


}