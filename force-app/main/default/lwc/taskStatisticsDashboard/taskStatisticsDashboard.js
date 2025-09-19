import { LightningElement, wire, api } from 'lwc';
import { loadScript } from 'lightning/platformResourceLoader';
import ChartJS from '@salesforce/resourceUrl/ChartJS';
import getTaskStatistics from '@salesforce/apex/TaskStatisticsController.getTaskStatistics';
import { refreshApex } from '@salesforce/apex';

export default class TaskStatisticsDashboard extends LightningElement {
    chartJsInitialized = false;
    statusChart;
    priorityChart;
    error;

    @wire(getTaskStatistics)
    wiredStatistics(result) {
        this.statistics = result;
        if (result.data) {
            this.error = undefined;
            if (this.chartJsInitialized) {
                this.initializeCharts();
            }
        } else if (result.error) {
            this.error = result.error;
            console.error('Error fetching task statistics:', result.error);
        }
    }

    get isLoading() {
        return !this.statistics || !this.statistics.data;
    }

    get overdueTaskCount() {
        return this.statistics?.data?.overdueTasks || 0;
    }

    renderedCallback() {
        if (this.chartJsInitialized) {
            return;
        }
        this.chartJsInitialized = true;

        Promise.all([
            loadScript(this, ChartJS)
        ]).then(() => {
            this.initializeCharts();
        }).catch(error => {
            this.error = error;
        });
    }

    initializeCharts() {
        if (this.statistics?.data) {
            // Clear existing charts if they exist
            if (this.statusChart) {
                this.statusChart.destroy();
            }
            if (this.priorityChart) {
                this.priorityChart.destroy();
            }
            
            try {
                this.createStatusChart();
                this.createPriorityChart();
            } catch (error) {
                console.error('Error creating charts:', error);
                this.error = error;
            }
        }
    }

    createStatusChart() {
        const ctx = this.template.querySelector('.status-chart')?.getContext('2d');
        if (!ctx) return;

        const statusData = this.statistics.data.statusCounts || {};
        
        const data = {
            labels: Object.keys(statusData),
            datasets: [{
                data: Object.values(statusData),
                backgroundColor: [
                    '#747474',
                    '#1589EE',
                    '#4BCA81',
                    '#FFB75D'
                ]
            }]
        };

        this.statusChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    title: {
                        display: true,
                        text: 'Tasks by Status'
                    }
                }
            }
        });
    }

    createPriorityChart() {
        const ctx = this.template.querySelector('.priority-chart')?.getContext('2d');
        if (!ctx) return;

        const priorityData = this.statistics.data.priorityCounts || {};
        
        const data = {
            labels: Object.keys(priorityData),
            datasets: [{
                data: Object.values(priorityData),
                backgroundColor: [
                    '#747474',
                    '#FFB75D',
                    '#FF9A3C',
                    '#FF5D5D'
                ]
            }]
        };

        this.priorityChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Tasks by Priority'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    @api
    refreshStats() {
        return refreshApex(this.statistics).then(() => {
            if (this.statusChart) {
                this.statusChart.destroy();
            }
            if (this.priorityChart) {
                this.priorityChart.destroy();
            }
            this.initializeCharts();
        });
    }
}