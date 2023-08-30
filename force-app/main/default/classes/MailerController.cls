global class MailerController Implements Schedulable{
    public void execute(SchedulableContext ctx){

        this.sendMail();

        // every day at 20h
        // system.schedule('Daily Mail Notifier', '0 13 9 * * ?', new MailerController());
    }

    private void sendMail(){
        List<Reservation__c> reservations = RservationController.getReservationsByFilterDate('TOMORROW');
        Messaging.SingleEmailMessage email = new Messaging.SingleEmailMessage();
        Set<String> toaddress = new Set<String>();

        for (Reservation__c res : reservations){
            toaddress.add(res.Owner.Email);
        }
        email.setSubject('Rappel de Réservation');
        email.setPlainTextBody('Vous avez une réservation demain');
        email.setToAddresses(new List<String>(toaddress));
        Messaging.sendEmail(New Messaging.SingleEmailMessage[]{ email });
    }

}