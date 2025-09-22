import { LightningElement, api, wire, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import deleteTask from '@salesforce/apex/TaskManagementController.deleteTask';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const FIELDS = [
    'Task_Management__c.Title__c',
    'Task_Management__c.Description__c',
    'Task_Management__c.Priority__c',
    'Task_Management__c.Status__c',
    'Task_Management__c.Due_Date__c',
    'Task_Management__c.Category__c',
    'Task_Management__c.Assigned_To__r.Name',
];

export default class TaskDetail extends LightningElement {
    @api taskId;
    @track isLoading = true;
    @track wiredTaskResult;
    @track isSummaryLoading = false;

    @wire(getRecord, { recordId: '$taskId', fields: FIELDS })
    wiredTask(result) {
        this.wiredTaskResult = result;
        if (result.data || result.error) {
            this.isLoading = false;
        }
    }

    handleSave(event) {
        event.preventDefault();
        const fields = event.detail.fields;
        this.template.querySelector('lightning-record-edit-form').submit(fields);
    }

    handleSuccess() {
        this.showToast('Success', 'Task updated successfully', 'success');
        this.dispatchEvent(new CustomEvent('close'));
        this.dispatchEvent(new CustomEvent('refresh'));
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleDelete() {
        this.isLoading = true;
        deleteTask({ taskId: this.taskId })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Task deleted successfully',
                        variant: 'success'
                    })
                );
                this.dispatchEvent(new CustomEvent('close'));
                this.dispatchEvent(new CustomEvent('refresh'));
            })
            .catch(error => {
                this.showToast('Error', 'Failed to delete', 'error');
            })
            .finally(() => {
                this.isLoading = false;
            });
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }
}
