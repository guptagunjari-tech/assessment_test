public with sharing class TaskStatisticsController {
    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getTaskStatistics() {
        Map<String, Object> statistics = new Map<String, Object>();
        
        AggregateResult[] statusCounts = [
            SELECT Status__c, COUNT(Id) cnt
            FROM Task_Management__c
            GROUP BY Status__c
        ];
        
        Map<String, Integer> statusMap = new Map<String, Integer>();
        for (AggregateResult ar : statusCounts) {
            statusMap.put((String)ar.get('Status__c'), (Integer)ar.get('cnt'));
        }
        statistics.put('statusCounts', statusMap);
        
        Integer overdueTasks = [
            SELECT COUNT() 
            FROM Task_Management__c 
            WHERE Due_Date__c < TODAY 
            AND Status__c != 'Completed'
        ];
        statistics.put('overdueTasks', overdueTasks);
        
        AggregateResult[] priorityCounts = [
            SELECT Priority__c, COUNT(Id) cnt
            FROM Task_Management__c
            GROUP BY Priority__c
        ];
        
        Map<String, Integer> priorityMap = new Map<String, Integer>();
        for (AggregateResult ar : priorityCounts) {
            priorityMap.put((String)ar.get('Priority__c'), (Integer)ar.get('cnt'));
        }
        statistics.put('priorityCounts', priorityMap);
        
        return statistics;
    }
    
    @AuraEnabled(cacheable=true)
    public static Integer getTaskTrendCount(Integer daysAgo) {
        Date targetDate = Date.today().addDays(-daysAgo);
        return [
            SELECT COUNT() 
            FROM Task_Management__c 
            WHERE CreatedDate >= :targetDate
        ];
    }
}