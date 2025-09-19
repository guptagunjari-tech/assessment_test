@isTest
public class TaskManagementControllerTest {
    @TestSetup
    static void makeData() {
        Task_Management__c task = new Task_Management__c(
            Title__c = 'Test Task',
            Description__c = 'Test Description',
            Status__c = 'Not Started',
            Priority__c = 'Medium',
            Due_Date__c = Date.today().addDays(7),
            Category__c = 'Development'
        );
        insert task;

        Task_Tag__c tag = new Task_Tag__c(
            Name = 'Test Tag',
            Task_Management__c = task.Id,
            Color__c = '#FF0000'
        );
        insert tag;
    }

    @isTest
    static void testGetTasks() {
        Test.startTest();
        List<Task_Management__c> tasks = TaskManagementController.getTasks('Not Started', 'Medium', 10, 0);
        Test.stopTest();

        Assert.areEqual(1, tasks.size(), 'Should return one task');
        Assert.areEqual('Test Task', tasks[0].Title__c, 'Title should match');
        Assert.areEqual('Not Started', tasks[0].Status__c, 'Status should match');
    }

    @isTest
    static void testCreateTask() {
        Task_Management__c newTask = new Task_Management__c(
            Title__c = 'New Test Task',
            Description__c = 'New Description',
            Status__c = 'Not Started',
            Priority__c = 'High'
        );
        List<String> tags = new List<String>{'Tag1', 'Tag2'};

        Test.startTest();
        Task_Management__c result = TaskManagementController.createTask(newTask, tags);
        Test.stopTest();

        List<Task_Tag__c> createdTags = [SELECT Id, Name FROM Task_Tag__c WHERE Task_Management__c = :result.Id];
        Assert.areEqual(2, createdTags.size(), 'Should create two tags');
    }

    @isTest
    static void testUpdateTask() {
        Task_Management__c task = [SELECT Id FROM Task_Management__c LIMIT 1];
        task.Status__c = 'In Progress';

        Test.startTest();
        Task_Management__c result = TaskManagementController.updateTask(task);
        Test.stopTest();

        Task_Management__c updatedTask = [SELECT Status__c FROM Task_Management__c WHERE Id = :task.Id];
        Assert.areEqual('In Progress', updatedTask.Status__c, 'Status should be updated');
    }

    @isTest
    static void testDeleteTask() {
        Task_Management__c task = [SELECT Id FROM Task_Management__c LIMIT 1];

        Test.startTest();
        TaskManagementController.deleteTask(task.Id);
        Test.stopTest();

        List<Task_Management__c> remainingTasks = [SELECT Id FROM Task_Management__c];
        Assert.areEqual(0, remainingTasks.size(), 'Task should be deleted');
    }

    @isTest
    static void testSearchTasks() {
        Test.startTest();
        List<Task_Management__c> results = TaskManagementController.searchTasks('Test');
        Test.stopTest();

        Assert.areEqual(1, results.size(), 'Should find one matching task');
        Assert.areEqual('Test Task', results[0].Title__c, 'Should find task with matching title');
    }
}