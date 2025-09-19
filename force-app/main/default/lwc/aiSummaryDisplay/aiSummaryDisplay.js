import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import generateTaskSummary from '@salesforce/apex/TaskAISummaryService.generateTaskSummary';

export default class AiSummaryDisplay extends LightningElement {
    @api taskId;
    @api summary;
    @api isGenerated;
    @api lastUpdated;
    @track isGenerating = false;

    handleGenerateSummary() {
        this.isGenerating = true;

        generateTaskSummary({ taskId: this.taskId })
            .then(() => {
                this.dispatchEvent(new CustomEvent('refresh'));
                this.showToast('Success', 'AI summary generated successfully', 'success');
            })
            .catch(error => {
                this.showToast('Error', error.body.message, 'error');
            })
            .finally(() => {
                this.isGenerating = false;
            });
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