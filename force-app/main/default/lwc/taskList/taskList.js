import { LightningElement, track, wire, api } from 'lwc';
import { refreshApex } from '@salesforce/apex';
import getTasks from '@salesforce/apex/TaskManagementController.getTasks';
import searchTasks from '@salesforce/apex/TaskManagementController.searchTasks';
import deleteTask from '@salesforce/apex/TaskManagementController.deleteTask';
import updateTask from '@salesforce/apex/TaskManagementController.updateTask';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const PAGE_SIZE = 10;
const DEBOUNCE_DELAY = 300;

export default class TaskList extends LightningElement {
    @track tasks = [];
    @track error;
    @track sortBy = 'CreatedDate';
    @track sortDirection = 'desc';
    @track statusFilter = '';
    @track priorityFilter = '';
    @track pageNumber = 1;
    @track showDeleteModal = false;
    @track showSummaryModal = false;
    @track taskToDelete;
    @track searchTerm = '';
    @track taskIdForSummary = '';
    @track draftValues = [];

    columns = [
        { label: 'Name', fieldName: 'Name__c', type: 'text', sortable: true, editable: true },
        { label: 'Title', fieldName: 'Title__c', type: 'text', sortable: true, editable: true },
        { label: 'Status', fieldName: 'Status__c', type: 'text', sortable: true, editable: true  },
        { label: 'Priority', fieldName: 'Priority__c', type: 'text', sortable: true, editable: true  },
        { label: 'Due Date', fieldName: 'Due_Date__c', type: 'date', sortable: true, editable: true },
        { label: 'Assigned To', fieldName: 'AssignedToName', type: 'text' },
        {
            type: 'action',
            typeAttributes: {
                rowActions: [
                    { label: 'Edit', name: 'edit' },
                    { label: 'Delete', name: 'delete' },
                    { label: 'Generate AI Summary', name: 'generateSummary' }
                ]
            }
        }
    ];

    statusOptions = [
        { label: 'All', value: '' },
        { label: 'Not Started', value: 'Not Started' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' },
        { label: 'On Hold', value: 'On Hold' }
    ];

    priorityOptions = [
        { label: 'All', value: '' },
        { label: 'Low', value: 'Low' },
        { label: 'Medium', value: 'Medium' },
        { label: 'High', value: 'High' },
        { label: 'Critical', value: 'Critical' }
    ];

    wiredTaskResult;

    @wire(getTasks, {
        statusFilter: '$statusFilter',
        priorityFilter: '$priorityFilter',
        limitSize: PAGE_SIZE,
        offset: '$offset',
        sortColumn: '$sortBy',
        sortDirection: '$sortDirection'
    })
    wiredTasks(result) {
        this.wiredTaskResult = result;
        if (result.data) {
            this.tasks = result.data.map(task => ({
                ...task,
                AssignedToName: task.Assigned_To__r ? task.Assigned_To__r.Name : ''
            }));
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.tasks = [];
        }
    }

    get offset() {
        return (this.pageNumber - 1) * PAGE_SIZE;
    }

    get isFirstPage() {
        return this.pageNumber === 1;
    }

    get isLastPage() {
        return this.tasks.length < PAGE_SIZE;
    }

  @track searchResults = []; // store SOSL search results

handleSearch(event) { 
    clearTimeout(this.searchTimeout);
    const searchTerm = event.target.value;

    this.searchTimeout = setTimeout(() => {
        this.searchTerm = searchTerm; // store current search

        if (searchTerm) {
            searchTasks({ searchTerm: searchTerm })
                .then(result => {
                    this.searchResults = result.map(task => ({
                        ...task,
                        AssignedToName: task.Assigned_To__r ? task.Assigned_To__r.Name : ''
                    }));
                    this.error = undefined;
                })
                .catch(error => {
                    this.error = error;
                    this.searchResults = [];
                });
        } else {
            this.searchResults = [];
            this.pageNumber = 1;
            this.sortBy = 'CreatedDate';
            this.sortDirection = 'desc';
            refreshApex(this.wiredTaskResult);
        }
    }, DEBOUNCE_DELAY);
}

get tasksToDisplay() {
    return this.searchTerm ? this.searchResults : (this.wiredTaskResult.data ? this.wiredTaskResult.data.map(task => ({
        ...task,
        AssignedToName: task.Assigned_To__r ? task.Assigned_To__r.Name : ''
    })) : []);
}

    handleStatusChange(event) {
        this.statusFilter = event.detail.value;
        this.pageNumber = 1;
    }

    handlePriorityChange(event) {
        this.priorityFilter = event.detail.value;
        this.pageNumber = 1;
    }

    handleSort(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        console.log('this.sortDirection', this.sortDirection);
        console.log('this.sortBy', this.sortBy);
        this.refreshTasks();
    }

    handleRowAction(event) {
        const action = event.detail.action;
        const row = event.detail.row;

        switch (action.name) {
            case 'edit':
                this.dispatchEvent(new CustomEvent('select', {
                    detail: row
                }));
                break;
            case 'delete':
                this.taskToDelete = row;
                this.showDeleteModal = true;
                break;
            case 'generateSummary':
                this.showSummaryModal = true;
                this.taskIdForSummary = row.Id;
                break;
            default:
                break;
        }
    }

    handleConfirmDelete() {
        deleteTask({ taskId: this.taskToDelete.Id })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Task deleted successfully',
                        variant: 'success'
                    })
                );
                this.refreshTasks();
            })
            .catch(error => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: error.body.message,
                        variant: 'error'
                    })
                );
            })
            .finally(() => {
                this.showDeleteModal = false;
                this.taskToDelete = null;
                this.dispatchEvent(new CustomEvent('refresh'));
            });
    }

    handleCancelDelete() {
        this.showDeleteModal = false;
        this.taskToDelete = null;
    }

    handleCloseSummary() {
        this.showSummaryModal = false;
        this.taskIdForSummary = '';
    }

    handlePrevious() {
        if (!this.isFirstPage) {
            this.pageNumber--;
        }
    }

    handleNext() {
        if (!this.isLastPage) {
            this.pageNumber++;
        }
    }

async handleSave(event) {
    const updatedFields = event.detail.draftValues;

    // Validate Due Date for each updated task
    for (let task of updatedFields) {
        if (task.Due_Date__c) {
            const dueDate = new Date(task.Due_Date__c);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // ignore time
            if (dueDate < today) {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: `Due Date for task cannot be in the past.`,
                        variant: 'error'
                    })
                );
                return;
            }
        }
        if (task.Title__c && /^\d/.test(task.Title__c.trim())) {
            this.dispatchEvent(
                        new ShowToastEvent({
                            title: 'Error',
                            message: `Task Title cannot start with a number.`,
                            variant: 'error'
                        })
                    );
            return;
        }
    }

    try {
        const updatePromises = updatedFields.map(task =>
            updateTask({ task })
        );

        await Promise.all(updatePromises);

        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Success',
                message: 'Tasks updated successfully',
                variant: 'success'
            })
        );

        this.draftValues = [];

        // Refresh the datatable
        return this.refreshTasks();
    } catch (error) {
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Error updating tasks',
                message: error.body.message,
                variant: 'error'
            })
        );
    }
}


    @api
    refreshTasks() {
        return refreshApex(this.wiredTaskResult);
    }
}
