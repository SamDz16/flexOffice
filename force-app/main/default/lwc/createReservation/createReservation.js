import { LightningElement, wire } from "lwc"
import { ShowToastEvent } from "lightning/platformShowToastEvent"
import { refreshApex } from "@salesforce/apex"

import getAvailableTables from "@salesforce/apex/TableController.getAvailableTables"
import saveReservation from "@salesforce/apex/RservationController.saveReservation"
import getWeatherDetails from "@salesforce/apex/OpenWeatherController.getWeatherDetails"

// import pub sub 
import { fireEvent } from "c/pubsub" 
import { CurrentPageReference } from "lightning/navigation"

// Object API Name
import OBJECT_API_NAME from "@salesforce/schema/Reservation__c"

// Fields
import DATE_FIELD from "@salesforce/schema/Reservation__c.Reservation_Date__c"
import TABLE_ID from "@salesforce/schema/Reservation__c.Table__c"

export default class CreateReservation extends LightningElement {
    objectApiName = OBJECT_API_NAME
    fields = [DATE_FIELD, TABLE_ID]

    selectedDate
    selectedTableId
    error = null
    tables
    tableEquipments
    allTablesData

    // the created reservation id
    reservationId

    BASE_URL = "https://api.openweathermap.org/data/2.5/forecast"
    ZIP_CODE = 13090
    COUNTRY_CODE = "fr"
    API_KEY = "92abc1f16d68dbb866b6cbe36d13e85e"

    weatherDetails

    refreshTable

    @wire(CurrentPageReference) pageRef

    @wire(getAvailableTables, { selectedDate: "$selectedDate"})
    async wireGetAvailableTables(result) {
        this.refreshTable = result
        
        const { data, error } = result

        if(data) {
            
            let fetchedTables = []
            this.allTablesData = data

            if(this.allTablesData) {                
                data.forEach(table => {

                        fetchedTables.push({label: table.Name + " - " + table.Salle__r.Name, value: table.Id})
                    })
                this.tables = fetchedTables
            }

        } else if (error) {
            this.error = error
            this.showToast("Something went wrong while fetching available tables", error.body.message, "error")
        }
    }

    async handleChangeDate(event) {
        this.selectedDate = event.target.value
    }

    handleChangeTable(event) {
        this.selectedTableId = event.target.value
        if(this.allTablesData) {
            this.allTablesData.forEach(tableData => {
                if(tableData.Id === this.selectedTableId) {                    
                    this.tableEquipments = tableData.Table_Equipements__c.split(";").join("\n")
                }
            })
        }
    }

    async handleCreateReservationClick() {
        try {
            // Pour nettoyer le composant
            this.weatherDetails = undefined

            const response = await getWeatherDetails({zip: this.ZIP_CODE, countryCode: this.COUNTRY_CODE, apiKey: this.API_KEY, baseUrl: this.BASE_URL})
            const {city, list} = await JSON.parse(response)

            // if(data.list[1].weather[0].main === "Rain" || data.list[1].weather[0].main === "Snow") {
                // only if rain or snow then show popup
                
                let obj = {}
                obj.cityName = city.name ? city.name : ""
                if(list.length > 1) {
                    if(list[1].weather.length > 0) {
                        obj.climat = list[1].weather[0].main ? list[1].weather[0].main : ""
                        obj.description = list[1].weather[0].description ? list[1].weather[0].description : ""
                    }
                }
                
                await refreshApex(this.refreshTable)

                this.weatherDetails = obj
            // } else {
                // await saveReservation({resDate: this.selectedDate, tableStrId: this.selectedTableId})
                // this.showToast("Reservation Created Successfully!", "done", "success")
            // }
  
        } 
        catch (error) {
            this.showToast("Something went wrong while saving reservation!", error.body.message, "error")
        }
    }

    async handleUserChoice(event) {
        const userChoice = event.detail
        if(userChoice === "accepted") {
            // user accepted the weather conditions
            this.reservationId = await saveReservation({resDate: this.selectedDate, tableStrId: this.selectedTableId})
            
            // Fire event after saving reservation record
            fireEvent(this.pageRef, "manage_reservation", "RESERVATION_CREATED")

            // refresh available tables
            await refreshApex(this.refreshTable)
            
        } else if(userChoice === "refused") {
            this.showToast("Reservation Creation is Cancelled!", "Aborted", "info")
        }
    }

    // ##############################################################################################################
    // UTILITY FUNCTION
    // ##############################################################################################################
    
    showToast(title, message, variant) {
        const toastEvent = new ShowToastEvent({
                title,
                message,
                variant
            });
        this.dispatchEvent(toastEvent);
    }
}