public with sharing class TaskManagementController {
    @AuraEnabled(cacheable=true)
    public static List<Task_Management__c> getTasks(String statusFilter, String priorityFilter, Integer limitSize, Integer offset, String sortColumn, String sortDirection) {
        String query = 'SELECT Id, Name__c, Title__c, Description__c, Status__c, Priority__c, Due_Date__c, ' +
                      'AI_Summary__c, AI_Summary_Generated__c, AI_Summary_Last_Updated__c, Category__c, ' +
                      'Assigned_To__r.Name, CreatedDate, LastModifiedDate FROM Task_Management__c';
        
        List<String> conditions = new List<String>();
        if (String.isNotBlank(statusFilter)) {
            conditions.add('Status__c = :statusFilter');
        }
        if (String.isNotBlank(priorityFilter)) {
            conditions.add('Priority__c = :priorityFilter');
        }
        
        if (!conditions.isEmpty()) {
            query += ' WHERE ' + String.join(conditions, ' AND ');
        }
        
        if(sortColumn != '' && sortDirection != '') {
            query += ' ORDER BY ' + sortColumn + ' ' + sortDirection;
        } else {
            query += ' ORDER BY CreatedDate DESC';
        }
        
        if (limitSize != null) {
            query += ' LIMIT :limitSize';
        }
        if (offset != null) {
            query += ' OFFSET :offset';
        }
        
        return Database.query(query);
    }

    @AuraEnabled
    public static Task_Management__c createTask(Task_Management__c task, List<String> tags) {
        insert task;
        
        if (tags != null && !tags.isEmpty()) {
            List<Task_Tag__c> taskTags = new List<Task_Tag__c>();
            for (String tag : tags) {
                taskTags.add(new Task_Tag__c(
                    Name = tag,
                    Task_Management__c = task.Id,
                    Color__c = generateRandomColor()
                ));
            }
            insert taskTags;
        }
        
        return task;
    }

    @AuraEnabled
    public static Task_Management__c updateTask(Task_Management__c task) {
        update task;
        return task;
    }

    @AuraEnabled
    public static void deleteTask(Id taskId) {
        delete new Task_Management__c(Id = taskId);
    }


@AuraEnabled(cacheable=true)
public static List<Task_Management__c> searchTasks(String searchTerm, String statusFilter, String priorityFilter) {
    if (String.isBlank(searchTerm)) return new List<Task_Management__c>();

    String escapedSearch = String.escapeSingleQuotes(searchTerm);

    String searchQuery = 'FIND \'' + escapedSearch + '*\' IN ALL FIELDS RETURNING Task_Management__c(' +
                         'Id, Name__c, Title__c, Description__c, Status__c, Priority__c, Due_Date__c, ' +
                         'AI_Summary__c, AI_Summary_Generated__c, Category__c, Assigned_To__r.Name ' +
                         'ORDER BY CreatedDate DESC)';

    List<List<SObject>> searchResults = Search.query(searchQuery);
    List<Task_Management__c> tasks = (List<Task_Management__c>)searchResults[0];

    String searchLower = searchTerm.toLowerCase();
    List<Task_Management__c> filteredTasks = new List<Task_Management__c>();
    for (Task_Management__c t : tasks) {
        if ((t.Title__c != null && t.Title__c.toLowerCase().contains(searchLower)) ||
            (t.Description__c != null && t.Description__c.toLowerCase().contains(searchLower))) {

            if ((String.isBlank(statusFilter) || t.Status__c == statusFilter) &&
                (String.isBlank(priorityFilter) || t.Priority__c == priorityFilter)) {
                filteredTasks.add(t);
            }
        }
    }
    return filteredTasks;
}


    private static String generateRandomColor() {
        String color = '#';
        String hex = '0123456789ABCDEF';
        for (Integer i = 0; i < 6; i++) {
            Integer idx = Math.mod(Math.abs(Crypto.getRandomInteger()), 16);
            color += hex.substring(idx, idx + 1);
        }
        return color;
    }
}
