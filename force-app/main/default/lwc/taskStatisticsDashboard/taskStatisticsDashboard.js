import { LightningElement, wire, api } from 'lwc';
import getTaskStatistics from '@salesforce/apex/TaskStatisticsController.getTaskStatistics';
import { refreshApex } from '@salesforce/apex';
import ChartJS from '@salesforce/resourceUrl/ChartJS';
import { loadScript } from 'lightning/platformResourceLoader';

export default class TaskStatisticsDashboard extends LightningElement {
    statistics;
    wiredStatisticsResult;
    error;
    chartJsInitialized = false;
    statusChart;
    priorityChart;
    Chart;

    @wire(getTaskStatistics)
    wiredStatistics(result) {
        this.wiredStatisticsResult = result;
        if (result.data) {
            this.statistics = result.data;
            this.error = undefined;

            if (this.chartJsInitialized) {
                this.renderCharts();
            }
            
        } else if (result.error) {
            this.error = result.error;
            this.statistics = undefined;
            console.error('Error fetching task statistics:', result.error);
        }
    }

    get isLoading() {
        return !this.statistics;
    }

    get overdueTaskCount() {
        return this.statistics?.overdueTasks || 0;
    }

    get statusDataArray() {
        if (!this.statistics?.statusCounts) return { labels: [], values: [] };
        return {
            labels: Object.keys(this.statistics.statusCounts),
            values: Object.values(this.statistics.statusCounts)
        };
    }

    get priorityDataArray() {
        if (!this.statistics?.priorityCounts) return { labels: [], values: [] };
        return {
            labels: Object.keys(this.statistics.priorityCounts),
            values: Object.values(this.statistics.priorityCounts)
        };
    }

    renderedCallback() {
        if (this.chartJsInitialized) return;

        loadScript(this, ChartJS + '?v=1.1')
            .then(() => {
                this.Chart = window.Chart;
                this.renderCharts();
            })
            .catch(err => {
                this.error = err;
                console.error('Error loading Chart.js', err);
            })
            .finally(() => {
                this.chartJsInitialized = true;
            });
    }

    renderCharts() {
        if (!this.statistics || !this.Chart) return;

        this.renderStatusChart();
        this.renderPriorityChart();
    }

    renderStatusChart() {
        const ctx = this.template.querySelector('.status-chart')?.getContext('2d');
        if (!ctx) return;

        const { labels, values } = this.statusDataArray;

        if (this.statusChart) this.statusChart.destroy();

        this.statusChart = new this.Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#747474', '#1589EE', '#4BCA81', '#FFB75D']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: 'Tasks by Status' }
                }
            }
        });
    }

    renderPriorityChart() {
        const ctx = this.template.querySelector('.priority-chart')?.getContext('2d');
        if (!ctx) return;

        const { labels, values } = this.priorityDataArray;

        if (this.priorityChart) this.priorityChart.destroy();

        this.priorityChart = new this.Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['#747474', '#FFB75D', '#FF9A3C', '#FF5D5D']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Tasks by Priority' }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }

    @api
    refreshStats() {
        return refreshApex(this.wiredStatisticsResult).then(() => {
            if (this.statusChart) this.statusChart.destroy();
            if (this.priorityChart) this.priorityChart.destroy();
            this.renderCharts();
        });
    }
}
