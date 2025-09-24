public with sharing class TaskStatisticsController {

    @AuraEnabled(cacheable=true)
    public static Map<String, Object> getTaskStatistics() {
        Map<String, Object> stats = new Map<String, Object>();

        stats.put('statusCounts', fetchStatusCounts());
        stats.put('priorityCounts', fetchPriorityCounts());
        stats.put('overdueTasks', calculateOverdueTasks());

        return stats;
    }

    private static Map<String, Integer> fetchStatusCounts() {
        Map<String, Integer> results = new Map<String, Integer>();

        List<AggregateResult> grouped = [
            SELECT Status__c, COUNT(Id) cnt
            FROM Task_Management__c
            GROUP BY Status__c
        ];

        for (AggregateResult row : grouped) {
            results.put((String)row.get('Status__c'), (Integer)row.get('cnt'));
        }
        return results;
    }

    private static Map<String, Integer> fetchPriorityCounts() {
        Map<String, Integer> results = new Map<String, Integer>();

        List<AggregateResult> grouped = [
            SELECT Priority__c, COUNT(Id) cnt
            FROM Task_Management__c
            GROUP BY Priority__c
        ];

        for (AggregateResult row : grouped) {
            results.put((String)row.get('Priority__c'), (Integer)row.get('cnt'));
        }
        return results;
    }

    private static Integer calculateOverdueTasks() {
        return [
            SELECT COUNT()
            FROM Task_Management__c
            WHERE Due_Date__c < TODAY
            AND Status__c != 'Completed'
        ];
    }

    @AuraEnabled(cacheable=true)
    public static Integer getTaskTrendCount(Integer daysAgo) {
        Date cutoff = Date.today().addDays(-daysAgo);

        return [
            SELECT COUNT()
            FROM Task_Management__c
            WHERE CreatedDate >= :cutoff
        ];
    }
}