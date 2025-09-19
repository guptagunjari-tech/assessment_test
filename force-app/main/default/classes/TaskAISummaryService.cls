public with sharing class TaskAISummaryService {
    private static final String OPENROUTER_ENDPOINT = 'callout:OpenRouter/api/v1/messages';
    private static final Integer MAX_RETRIES = 3;
    private static final Integer RETRY_DELAY_MS = 1000;
    
    @AuraEnabled
    public static void generateTaskSummary(Id taskId) {
        Task_Management__c task = [SELECT Id, Title__c, Description__c, Priority__c, Due_Date__c, Category__c 
                                 FROM Task_Management__c WHERE Id = :taskId LIMIT 1];
        
        String prompt = buildPrompt(task);
        String summary = callOpenRouterAPI(prompt);
        
        if (String.isNotBlank(summary)) {
            task.AI_Summary__c = summary;
            task.AI_Summary_Generated__c = true;
            task.AI_Summary_Last_Updated__c = System.now();
            update task;
        }
    }
    
    private static String buildPrompt(Task_Management__c task) {
        return 'Summarize the following task concisely:\n\n' +
               'Title: ' + task.Title__c + '\n' +
               'Description: ' + (task.Description__c != null ? task.Description__c : 'N/A') + '\n' +
               'Priority: ' + task.Priority__c + '\n' +
               'Due Date: ' + (task.Due_Date__c != null ? task.Due_Date__c.format() : 'Not set') + '\n' +
               'Category: ' + task.Category__c;
    }
    
    private static String callOpenRouterAPI(String prompt) {
        Integer retries = 0;
        while (retries < MAX_RETRIES) {
            try {
                Http http = new Http();
                HttpRequest req = new HttpRequest();
                req.setEndpoint(OPENROUTER_ENDPOINT);
                req.setMethod('POST');
                req.setHeader('Content-Type', 'application/json');
                
                Map<String, Object> body = new Map<String, Object>{
                    'messages' => new List<Object>{
                        new Map<String, String>{
                            'role' => 'user',
                            'content' => prompt
                        }
                    },
                    'model' => 'mistralai/mixtral-8x7b-instruct'
                };
                
                req.setBody(JSON.serialize(body));
                
                HttpResponse res = http.send(req);
                
                if (res.getStatusCode() == 200) {
                    Map<String, Object> response = (Map<String, Object>)JSON.deserializeUntyped(res.getBody());
                    List<Object> choices = (List<Object>)response.get('choices');
                    if (!choices.isEmpty()) {
                        Map<String, Object> choice = (Map<String, Object>)choices[0];
                        Map<String, Object> message = (Map<String, Object>)choice.get('message');
                        return (String)message.get('content');
                    }
                }
                return null;
            } catch (Exception e) {
                if (retries == MAX_RETRIES - 1) {
                    throw new AuraHandledException('Failed to generate AI summary: ' + e.getMessage());
                }
                retries++;
                if (Test.isRunningTest()) continue;
                Integer delay = Integer.valueOf(RETRY_DELAY_MS * Math.pow(2, retries));
                // Simple exponential backoff delay
                System.debug('Retrying after ' + delay + ' ms');
            }
        }
        return null;
    }
}