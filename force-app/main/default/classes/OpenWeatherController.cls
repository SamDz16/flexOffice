public with sharing class OpenWeatherController{
    @AuraEnabled(cacheable = true)
    public static string getWeatherDetails(String zip, String countryCode, String apiKey, String baseUrl){
        try{
            String endPoint = baseUrl + '?zip=' + zip + ',' + countryCode + '&lang=fr&cnt=2&APPID=' + apiKey;
            HttpRequest request = new HttpRequest();
            HttpResponse response = new HttpResponse();
            Http http = new Http();
            request.setEndpoint(endPoint);
            request.setMethod('GET');
            response = http.send(request);
            if (response.getStatusCode() == 200){
                return response.getBody();
            } else{
                throw new AuraHandledException('Error : Please check zipcode or country');
            }
        } catch (Exception e){
            throw new AuraHandledException(e.getMessage());
        }
    }

}