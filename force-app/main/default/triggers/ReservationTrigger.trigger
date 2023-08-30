trigger ReservationTrigger on Reservation__c(before update, before delete, before insert, after update ){

    switch  on Trigger.operationType{
        when BEFORE_DELETE{
            // before delete reservation records
            for (Reservation__c res : Trigger.old){
                Trigger.oldMap.get(res.Id).addError('Une réservation ne peut être supprimée! Essayez plutôt de l\'annuler');
            }
        }
        when BEFORE_UPDATE{
            // before update reservation records
            Date todayDate = date.newInstance(date.today().year(), date.today().month(), date.today().day());

            for (Reservation__c res : Trigger.new ){
                Date resDate = date.newInstance(res.Reservation_Date__c.year(), res.Reservation_Date__c.month(), res.Reservation_Date__c.day());

                // Ne pas autoriser de modifier les réservation qui sont déjà passées où de modifier une réservation vers une date qui est déjà passée
                if (todayDate.daysBetween(resDate) < 0 || todayDate.daysBetween(Trigger.oldMap.get(res.Id).Reservation_Date__c) < 0){
                    Trigger.newMap.get(res.Id).addError('Pas possible de modifier une réservation dont la date est déjà passée!');
                } else if (todayDate.daysBetween(Trigger.oldMap.get(res.id).Reservation_Date__c) <= 1){
                    // Comparer l'ancienne date de réservation avec la date d'aujourd'hui
                    Trigger.newMap.get(res.Id).addError('Pas possible de modifier cette réservation. Une réservation peut être modifiée au plus tard 2 jour en amont');
                } else if (Trigger.oldMap.get(res.Id).Is_Reservation_Cancelled__c != res.Is_Reservation_Cancelled__c){
                    Id tableId = res.Table__c;
                    List<Reservation__c> fetchedReservations = [SELECT Id, Reservation_Date__c, Table__r.Name, Is_Reservation_Cancelled__c
                                                                FROM Reservation__c
                                                                WHERE Is_Reservation_Cancelled__c = false AND Reservation_Date__c = :resDate AND Table__c = :tableId];
                    if (fetchedReservations.size() == 1 && res.Is_Reservation_Cancelled__c == false){
                        // there is a reservation
                        Trigger.newMap.get(res.Id).addError('Une réservation existe déjà dans la date et la table sélectionées.');
                    }
                } else{
                    // check if there is no non-cancelled reservation in this date and in this table
                    Id tableId = res.Table__c;
                    List<Reservation__c> fetchedReservations = [SELECT Id, Reservation_Date__c, Table__r.Name, Is_Reservation_Cancelled__c
                                                                FROM Reservation__c
                                                                WHERE Is_Reservation_Cancelled__c = false AND Reservation_Date__c = :resDate AND Table__c = :tableId AND Id != :Trigger.oldMap.get(res.Id).Id];
                    if (fetchedReservations.size() > 0){
                        // there is a reservation
                        Trigger.newMap.get(res.Id).addError('Une réservation existe déjà dans la date et la table sélectionées.');
                    }

                }
            }
        }
        when BEFORE_INSERT{
            // prevent from inserting reservation where date and table name already exists in database
            for (Reservation__c res : Trigger.new ){
                Id tableId = res.Table__c;
                Date resDate = date.newInstance(res.Reservation_Date__c.year(), res.Reservation_Date__c.month(), res.Reservation_Date__c.day());

                List<Reservation__c> fetchedReservations = [SELECT Id, Reservation_Date__c, Table__r.Name, Is_Reservation_Cancelled__c
                                                            FROM Reservation__c
                                                            WHERE Is_Reservation_Cancelled__c = false AND Reservation_Date__c = :resDate AND Table__c = :tableId];

                if (fetchedReservations.size() > 0){
                    // there is a reservation
                    res.addError('Une réservation existe déjà dans la date et la table sélectionées.');
                }

            }
        }
        when AFTER_UPDATE{
            // if update was successfull, send mail to reservation owner
            List<Reservation__c> reservations = new List<Reservation__c>();
            List<Id> resIds = new List<Id>();
            Set<String> toAdresses = new Set<String>();
            for (Reservation__c res : Trigger.old){

                resIds.add(res.Id);
            }

            Id ownerId;
            String ownerName;
            String ownerEmail;
            String resName;


            List<Messaging.SingleEmailMessage> singleMessages = new List<Messaging.SingleEmailMessage>();
            for (Reservation__c reservation : [SELECT Id, Name, CreatedById, Owner.Email, Owner.Name
                                               FROM Reservation__c
                                               WHERE Id IN:resIds]){

                Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
                email.setSubject('Réservation modifiée');
                ownerId = reservation.CreatedById;
                ownerName = reservation.Owner.Name;
                ownerEmail = reservation.Owner.Email;
                resName = reservation.Name;
                email.setPlainTextBody('La réservation ' + resName + ' de ' + ownerName + ' ayant l\'email: ' + ownerEmail + ' a été modifiée avec succès.');
                email.setToAddresses(new List<String>(toAdresses));

                singleMessages.add(reservation.Owner.Email);

            }

            Messaging.sendEmail(singleMessages);
        }
    }
}