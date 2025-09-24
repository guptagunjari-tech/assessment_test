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
    static void testGenerateTaskSummary_Success() {
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

        System.assertEquals(true, updatedTask.AI_Summary_Generated__c, 'AI Summary should be marked as generated');
        System.assertNotEquals(null, updatedTask.AI_Summary__c, 'AI Summary should not be null');
        System.assertNotEquals(null, updatedTask.AI_Summary_Last_Updated__c, 'Last updated timestamp should be set');
    }

    @isTest
    static void testGenerateTaskSummary_Failure() {
        Task_Management__c task = [SELECT Id FROM Task_Management__c LIMIT 1];

        Test.setMock(HttpCalloutMock.class, new OpenRouterErrorMock());

        Test.startTest();
        TaskAISummaryService.generateTaskSummary(task.Id);
        Test.stopTest();

        Task_Management__c updatedTask = [
            SELECT AI_Summary__c, AI_Summary_Generated__c, AI_Summary_Last_Updated__c 
            FROM Task_Management__c 
            WHERE Id = :task.Id
        ];

        System.assertEquals(null, updatedTask.AI_Summary__c, 'AI Summary should be null on callout error');
        System.assertEquals(false, updatedTask.AI_Summary_Generated__c, 'AI Summary should not be marked as generated');
        System.assertEquals(null, updatedTask.AI_Summary_Last_Updated__c, 'Last updated timestamp should not be set');
    }

    public class OpenRouterMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            System.assertEquals('POST', req.getMethod(), 'HTTP method should be POST');
            System.assertEquals(
                'callout:ORCred/chat/completions', 
                req.getEndpoint(), 
                'Endpoint should match'
            );

            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"choices":[{"message":{"content":"Test AI Summary"}}]}');
            res.setStatusCode(200);
            return res;
        }
    }

    public class OpenRouterErrorMock implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            System.assertEquals('POST', req.getMethod(), 'HTTP method should be POST');
            System.assertEquals(
                'callout:ORCred/chat/completions', 
                req.getEndpoint(), 
                'Endpoint should match'
            );

            HttpResponse res = new HttpResponse();
            res.setStatusCode(500);
            res.setBody('{"error": "Test error"}');
            return res;
        }
    }
}