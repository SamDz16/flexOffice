public with sharing class TableController{
    @AuraEnabled(cacheable = true)
    public static List<Table__c> getAvailableTables(String selectedDate){
        String stringDate = selectedDate;
        List<String> dateParts = stringDate.split('-');

        Date d = date.newinstance(integer.valueOf(dateParts.get(0)), integer.valueOf(dateParts.get(1)), integer.valueOf(dateParts.get(2)));

        try{
            return [SELECT Id, Name, Table_Equipements__c, Salle__r.Name
                    FROM Table__c
                    WHERE Id NOT IN (SELECT Id
                                     FROM Reservation__c
                                     WHERE Is_Reservation_Cancelled__c = false AND Reservation_Date__c = :d)];
        } catch (Exception e){
            throw new AuraHandledException(e.getMessage());
        }
    }
}