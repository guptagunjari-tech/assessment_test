import { LightningElement, api, wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import deleteTask from '@salesforce/apex/TaskManagementController.deleteTask';

const FIELDS = [
    'Task_Management__c.Title__c',
    'Task_Management__c.Description__c',
    'Task_Management__c.Status__c',
    'Task_Management__c.Priority__c',
    'Task_Management__c.Due_Date__c',
    'Task_Management__c.Category__c',
    'Task_Management__c.AI_Summary__c',
    'Task_Management__c.AI_Summary_Generated__c',
    'Task_Management__c.AI_Summary_Last_Updated__c',
    'Task_Management__c.Assigned_To__r.Name'
];

export default class TaskDetail extends LightningElement {
    @api taskId;

    @wire(getRecord, { recordId: '$taskId', fields: FIELDS })
    task;

    get assignedToName() {
        return this.task.data?.fields?.Assigned_To__r?.value?.fields?.Name?.value || 'Unassigned';
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleEdit() {
        this.dispatchEvent(new CustomEvent('edit', {
            detail: {
                recordId: this.taskId
            }
        }));
    }

    handleDelete() {
        if (confirm('Are you sure you want to delete this task?')) {
            deleteTask({ taskId: this.taskId })
                .then(() => {
                    this.dispatchEvent(new CustomEvent('close'));
                    this.dispatchEvent(new CustomEvent('refresh'));
                    this.showToast('Success', 'Task deleted successfully', 'success');
                })
                .catch(error => {
                    this.showToast('Error', error.body.message, 'error');
                });
        }
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