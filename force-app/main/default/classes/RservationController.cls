public with sharing class RservationController{
    @AuraEnabled(cacheable = true)
    public static List<Reservation__c> getReservationsByFilterDate(String filter){

        try{
            switch  on filter{
                when 'THIS_WEEK'{
                    return [SELECT Id, Name, Reservation_Date__c, Table__r.Name, Table__r.Salle__r.Name, Is_Reservation_Cancelled__c, Owner.Name
                            FROM Reservation__c
                            WHERE Reservation_Date__c <= THIS_WEEK
                            ORDER BY Reservation_Date__c DESC
                            LIMIT 20];
                }
                when 'ALL'{
                    return [SELECT Id, Name, Reservation_Date__c, Table__r.Name, Table__r.Salle__r.Name, Is_Reservation_Cancelled__c, Owner.Name
                            FROM Reservation__c
                            ORDER BY Reservation_Date__c DESC];
                }
                when 'TODAY'{
                    return [SELECT Id, Name, Reservation_Date__c, Table__r.Name, Table__r.Salle__r.Name, Is_Reservation_Cancelled__c, Owner.Name
                            FROM Reservation__c
                            WHERE Reservation_Date__c = TODAY
                            ORDER BY Reservation_Date__c DESC
                            LIMIT 20];

                }
                when 'YESTERDAY'{
                    return [SELECT Id, Name, Reservation_Date__c, Table__r.Name, Table__r.Salle__r.Name, Is_Reservation_Cancelled__c, Owner.Name
                            FROM Reservation__c
                            WHERE Reservation_Date__c = YESTERDAY
                            ORDER BY Reservation_Date__c DESC
                            LIMIT 20];
                }
                when else{
                    return [SELECT Id, Name, Reservation_Date__c, Table__r.Name, Table__r.Salle__r.Name, Is_Reservation_Cancelled__c, Owner.Name, Owner.Email
                            FROM Reservation__c
                            WHERE Reservation_Date__c = TOMORROW
                            ORDER BY Reservation_Date__c DESC
                            LIMIT 20];
                }
            }


        } catch (Exception e){
            throw new AuraHandledException(e.getMessage());
        }
    }

    // @AuraEnabled
    // public static List<Reservation__c> getDate(String filter){
    //     try {
    //         return [SELECT Id, Name, Reservation_Date__c, Table__r.Name, Table__r.Salle__r.Name, Is_Reservation_Cancelled__c, Owner.Name, Owner.Email
    //                         FROM Reservation__c
    //                         WHERE Reservation_Date__c = TOMORROW
    //                         ORDER BY Reservation_Date__c DESC
    //                         LIMIT 20]
    //     } catch (Exception e) {
    //         throw new AuraHandledException(e.getMessage());
    //     }
    // }
    @AuraEnabled
    public static Id saveReservation(String resDate, String tableStrId){
        List<String> dateParts = resDate.split('-');

        Date d = date.newinstance(integer.valueOf(dateParts.get(0)), integer.valueOf(dateParts.get(1)), integer.valueOf(dateParts.get(2)));
        Id tableId = Id.valueOf(tableStrId);

        try{
            Reservation__c res = new Reservation__c(Reservation_Date__c = d, Table__c = tableId);
            insert res;
            return res.Id;
        } catch (Exception e){
            throw new AuraHandledException(e.getMessage());
        }
    }

}