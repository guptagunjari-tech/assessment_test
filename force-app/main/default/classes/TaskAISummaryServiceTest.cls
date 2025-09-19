@isTest
public class TaskAISummaryServiceTest {
    @TestSetup
    static void makeData() {
        Task_Management__c task = new Task_Management__c(
            Title__c = 'Test Task for AI Summary',
            Description__c = 'This is a test description for AI summary generation',
            Status__c = 'Not Started',
            Priority__c = 'High',
            Due_Date__c = Date.today().addDays(7),
            Category__c = 'Development'
        );
        insert task;
    }

    @isTest
    static void testGenerateTaskSummary() {
        Task_Management__c task = [SELECT Id FROM Task_Management__c LIMIT 1];

        Test.setMock(HttpCalloutMock.class, new OpenRouterMock());

        Test.startTest();
        TaskAISummaryService.generateTaskSummary(task.Id);
        Test.stopTest();

        Task_Management__c updatedTask = [
            SELECT AI_Summary__c, AI_Summary_Generated__c, AI_Summary_Last_Updated__c 
            FROM Task_Management__c 
            WHERE Id = :task.Id
        ];

        Assert.isTrue(updatedTask.AI_Summary_Generated__c, 'AI Summary should be marked as generated');
        Assert.isNotNull(updatedTask.AI_Summary__c, 'AI Summary should not be null');
        Assert.isNotNull(updatedTask.AI_Summary_Last_Updated__c, 'Last updated timestamp should be set');
    }

    @isTest
    static void testGenerateTaskSummaryError() {
        Task_Management__c task = [SELECT Id FROM Task_Management__c LIMIT 1];

        Test.setMock(HttpCalloutMock.class, new OpenRouterErrorMock());

        Test.startTest();
        try {
            TaskAISummaryService.generateTaskSummary(task.Id);
            Assert.fail('Should throw an exception');
        } catch (AuraHandledException e) {
            Assert.isTrue(e.getMessage().contains('Failed to generate AI summary'), 'Should throw correct error message');
        }
        Test.stopTest();
    }

    public class OpenRouterMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            Assert.areEqual('POST', req.getMethod(), 'HTTP method should be POST');
            Assert.areEqual('callout:OpenRouter/api/v1/messages', req.getEndpoint(), 'Endpoint should match');

            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"choices":[{"message":{"content":"Test AI Summary"}}]}');
            res.setStatusCode(200);
            return res;
        }
    }

    public class OpenRouterErrorMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(500);
            res.setBody('{"error": "Test error"}');
            return res;
        }
    }
}