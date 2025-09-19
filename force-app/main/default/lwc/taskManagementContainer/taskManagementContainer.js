import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class TaskManagementContainer extends LightningElement {
    @track selectedTask;

    handleTaskSelect(event) {
        this.selectedTask = event.detail;
    }

    handleCloseDetail() {
        this.selectedTask = null;
    }

    handleNewTask(event) {
        this.dispatchToast('Success', 'Task created successfully', 'success');
        this.handleRefresh();
    }

    handleRefresh() {
        this.template.querySelector('c-task-list').refreshTasks();
        this.template.querySelector('c-task-statistics-dashboard').refreshStats();
    }

    dispatchToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: title,
                message: message,
                variant: variant
            })
        );
    }
}