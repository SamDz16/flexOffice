import { LightningElement, api, wire } from "lwc"
import { ShowToastEvent } from "lightning/platformShowToastEvent"
import { NavigationMixin } from "lightning/navigation"
import { refreshApex } from "@salesforce/apex"
import { subscribe, unsubscribe, onError } from "lightning/empApi"

// import pub sub 
import { fireEvent } from "c/pubsub" 
import { CurrentPageReference } from "lightning/navigation"

import getPdfPrint from "@salesforce/apex/ReservationPdfController.getPdfPrint"

import { registerListener, unregisterAllListeners } from "c/pubsub" 


import getReservationsByFilterDate from "@salesforce/apex/RservationController.getReservationsByFilterDate"

export default class ReservationListManager extends NavigationMixin(LightningElement) {
    @wire(CurrentPageReference) pageRef

    @api filter = "TOMORROW"

    error = null
    reservations = []
    refreshTable

    draftValues

    // isLoading = false;
    recordIdToUpdate
 
    subscription = {}
    CHANNEL_NAME = "/event/Refresh_Reservation_List__e"

    @wire(CurrentPageReference) pageRef

    connectedCallback() {

        // for create reservation
        registerListener("manage_reservation", this.handleManageReservation, this)

        // for updatze reservation
        registerListener("update_res", this.handleUpdateRes, this)
    }

    refreshList() {
        this.filter = this.filter
    }

    disconnectedCallback() {
        // for create and update reservation
        unregisterAllListeners(this)
    }

    async handleManageReservation(mssg) {

        switch (mssg) {
            case "RESERVATION_UPDATED":
            case "RESERVATION_CREATED":
                // this.filter = this.filter
                await refreshApex(this.refreshTable)
                break;
        }
    }

    @wire(getReservationsByFilterDate, { filter: '$filter' })
    async getReservationsByFilterDateHandler(result) {
        this.refreshTable = result

        const { data, error } = result
        if (data) {
            this.reservations = this.getProperReservationDataFormat(data)
            
            if(this.reservations.length > 0) {
                this.showToast("Data Fetched Successfully!", "done", "success")
                // refresh apex
                try {
                    await refreshApex(this.refreshTable)
                } catch (err) {
                    this.showToast("Error while refresh", err, "error")                   
                }
            } else {
                this.showToast("No Data Present in Database!", "done", "info")                    
            }
            
        } else if (error) {
            this.error = error
            this.showToast("Error while fetching data from Database", error.body.message, "error")
        }
    }
    
    get columns() {
        const actions = [
            { label: 'Edit', name: 'edit' }
        ];

        return [
            { label: 'Id', fieldName: "id", type: "id", editable: false, displayReadOnlyIcon: true },
            { label: 'Numéro Réservation', fieldName: 'name', type: "auto number", editable: false, displayReadOnlyIcon: true },
            { label: 'Date Réservation',   fieldName: 'reservationDate', editable: false, type: "date-local" },
            { label: 'Numéro Table', fieldName: 'tableName', editable: false, type: "text" },
            { label: 'Nom Salle Réservée', fieldName: 'salleName', editable: false, type: "text" },
            { label: 'Annulée ?', fieldName: 'status', editable: false, type: "text" },
            { label: 'Créée Par',          fieldName: 'owner', editable: false, displayReadOnlyIcon: true },
            { type: 'action', typeAttributes: { rowActions: actions, menuAlignment: 'right' } }
        ]
    }

    async handleRowAction(event) {

        const row = event.detail.row  
        const reservationRecord = await JSON.parse(JSON.stringify(row))
        const reservationRecordId = reservationRecord.id

        this.recordIdToUpdate = reservationRecordId

        // fire event to update Reservation
        fireEvent(this.pageRef, "update", this.recordIdToUpdate)
  
        // this[NavigationMixin.Navigate]({
        //     type:'standard__recordPage',
        //     attributes:{
        //         "recordId": reservationRecordId,
        //         "objectApiName":"Reservation__c",
        //         "actionName": "edit"
        //     }
        // }) 
    }

    generatePDF() {
        getPdfPrint()
        .then(pdf => window.open(pdf))
        .catch(err => this.showToast("Les employées ne peuvent pas effectuer cette opération.", err.body.message, "error"))
    }

    // ##############################################################################################################
    // UTILITY FUNCTIONS
    // ##############################################################################################################
    
    showToast(title, message, variant) {
        const toastEvent = new ShowToastEvent({
                title,
                message,
                variant
            });
        this.dispatchEvent(toastEvent);
    }

    getProperReservationDataFormat(data) {
        // iterate over data
        let fetchedReservations = []
        data.forEach(reservation => {
            let recordObj = {}

            recordObj.id = reservation.Id
            recordObj.name = reservation.Name
            recordObj.reservationDate = reservation.Reservation_Date__c
            recordObj.tableName = reservation.Table__r.Name
            recordObj.salleName = reservation.Table__r.Salle__r.Name
            recordObj.status = reservation.Is_Reservation_Cancelled__c ? "Oui" : "Non"
            recordObj.owner = reservation.Owner.Name
            
            fetchedReservations.push(recordObj)
        })
        return fetchedReservations
    }
}