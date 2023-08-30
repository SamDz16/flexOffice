public class ReservationPdfController{
    private final List<Reservation__c> reservations;
    public ReservationPdfController(ApexPages.StandardController stdController){

        this.reservations = [SELECT Id, Name, Reservation_Date__c, Table__r.Name, Table__r.Salle__r.Name, Is_Reservation_Cancelled__c, Owner.Name
                             FROM Reservation__c
                             WHERE Reservation_Date__c = TODAY];
    }

    public List<Reservation__c> getReservations(){
        return reservations;
    }

    @AuraEnabled
    public static String getPdfPrint(){
        try{
            // get current user profile
            String profileName = getCurrentUserProfile();
            if (profileName != 'Isochronix Employee'){
                PageReference pdfPage = Page.generatePDF;
                Blob pdfBlob = pdfPage.getContent();
                return pdfPage.getUrl();
            } else{
                throw new AuraHandledException('Les employées ne peuvent pas effectuer cette opétaion.');
            }

        } catch (Exception e){
            throw new AuraHandledException(e.getMessage());
        }
    }

    private static String getCurrentUserProfile(){

        Id profileId = Userinfo.getProfileId();
        Profile p;
        if (profileId != null){
            p = [SELECT Name
                 FROM Profile
                 WHERE Id = :profileId];

        }
        return p.Name;
    }

}