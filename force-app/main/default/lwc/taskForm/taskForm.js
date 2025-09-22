import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createTask from '@salesforce/apex/TaskManagementController.createTask';
import generateAISummary from '@salesforce/apex/TaskAISummaryService.generateTaskSummary';

export default class TaskForm extends LightningElement {
    @api recordId;
    @track showModal = false;
    @track tags = [];
    @track isSaving = false;

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

    handleTagsChange(event) {
        const value = event.target.value;
        this.tags = value.split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);
    }

    handleRemoveTag(event) {
        const tagToRemove = event.target.label;
        this.tags = this.tags.filter(tag => tag !== tagToRemove);
    }

    handleSubmit(event) {
        event.preventDefault();
        this.isSaving = true;

        const fields = event.detail.fields;
        const task = { ...fields };

        createTask({ task, tags: [] })
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
}