@isTest
public class TaskStatisticsControllerTest {
    @TestSetup
    static void makeData() {
        List<Task_Management__c> tasks = new List<Task_Management__c>();
        
        // Create tasks with different statuses
        tasks.add(new Task_Management__c(
            Title__c = 'Not Started Task',
            Status__c = 'Not Started',
            Priority__c = 'Low',
            Due_Date__c = Date.today().addDays(7)
        ));
        
        tasks.add(new Task_Management__c(
            Title__c = 'In Progress Task',
            Status__c = 'In Progress',
            Priority__c = 'Medium',
            Due_Date__c = Date.today().addDays(3)
        ));
        
        tasks.add(new Task_Management__c(
            Title__c = 'Completed Task',
            Status__c = 'Completed',
            Priority__c = 'High',
            Due_Date__c = Date.today().addDays(-1)
        ));
        
        tasks.add(new Task_Management__c(
            Title__c = 'Overdue Task',
            Status__c = 'Not Started',
            Priority__c = 'Critical',
            Due_Date__c = Date.today().addDays(-7)
        ));
        
        insert tasks;
    }

    @isTest
    static void testGetTaskStatistics() {
        Test.startTest();
        Map<String, Object> stats = TaskStatisticsController.getTaskStatistics();
        Test.stopTest();

        // Verify status counts
        Map<String, Integer> statusCounts = (Map<String, Integer>)stats.get('statusCounts');
        Assert.isNotNull(statusCounts, 'Status counts should not be null');
        Assert.areEqual(2, statusCounts.get('Not Started'), 'Should have 2 Not Started tasks');
        Assert.areEqual(1, statusCounts.get('In Progress'), 'Should have 1 In Progress task');
        Assert.areEqual(1, statusCounts.get('Completed'), 'Should have 1 Completed task');

        // Verify priority counts
        Map<String, Integer> priorityCounts = (Map<String, Integer>)stats.get('priorityCounts');
        Assert.isNotNull(priorityCounts, 'Priority counts should not be null');
        Assert.areEqual(1, priorityCounts.get('Low'), 'Should have 1 Low priority task');
        Assert.areEqual(1, priorityCounts.get('Medium'), 'Should have 1 Medium priority task');
        Assert.areEqual(1, priorityCounts.get('High'), 'Should have 1 High priority task');
        Assert.areEqual(1, priorityCounts.get('Critical'), 'Should have 1 Critical priority task');

        // Verify overdue tasks
        Integer overdueTasks = (Integer)stats.get('overdueTasks');
        Assert.areEqual(1, overdueTasks, 'Should have 1 overdue task');
    }

    @isTest
    static void testGetTaskTrendCount() {
        Test.startTest();
        Integer count = TaskStatisticsController.getTaskTrendCount(7);
        Test.stopTest();

        Assert.areEqual(4, count, 'Should count all tasks created in the last 7 days');
    }
}