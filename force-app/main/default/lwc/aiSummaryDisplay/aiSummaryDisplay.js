import { LightningElement, api, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import generateTaskSummary from '@salesforce/apex/TaskAISummaryService.generateTaskSummary';
import { getRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';

const FIELDS = [
    'Task_Management__c.AI_Summary__c',
    'Task_Management__c.AI_Summary_Last_Updated__c'
];

export default class AiSummaryDisplay extends LightningElement {
    @api taskId;
    @api summary;
    @api lastUpdated;
    @track isGenerating = false;
    wiredTaskResult;

    @wire(getRecord, { recordId: '$taskId', fields: FIELDS })
    wiredTask(result) {
        this.wiredTaskResult = result;

        if (result.data) {
            const fields = result.data.fields || {};
            this.summary = fields.AI_Summary__c?.value || '';
            this.lastUpdated = fields.AI_Summary_Last_Updated__c?.value || '';
        } else if (result.error) {
            console.error('Error fetching AI summary:', result.error);
            this.summary = '';
            this.lastUpdated = '';
        }
    }

    handleGenerateSummary() {
        this.isGenerating = true;

        generateTaskSummary({ taskId: this.taskId })
            .then(() => {
                this.showToast('Success', 'AI summary generated successfully', 'success');
            })
            .catch(error => {
                this.showToast('Error', error, 'error');
            })
            .finally(() => {
                this.isGenerating = false;
                console.log('wiredTaskResult: ', this.wiredTaskResult);
                refreshApex(this.wiredTaskResult);
            });

        console.log(task);
        this.summary = task.AI_Summary__c;
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