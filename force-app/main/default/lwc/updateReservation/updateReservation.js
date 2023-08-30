import { LightningElement, wire } from "lwc"
import { CurrentPageReference } from "lightning/navigation"
import { ShowToastEvent } from "lightning/platformShowToastEvent"

import { registerListener, unregisterAllListeners } from "c/pubsub" 
import { fireEvent } from "c/pubsub" 



export default class UpdateReservation extends LightningElement {

    recordIdToUpdate

    @wire(CurrentPageReference) pageRef

    connectedCallback() {
        // for updat reservation
        registerListener("update", this.handleUpdate, this)
    }

    handleUpdate(recordId) {
        this.recordIdToUpdate = recordId
    }

    disconnectedCallback() {
        // for update reservation
        unregisterAllListeners(this)
    }

    handleSuccessUpdate(event) {
        this.showToast("Record Updated Successfully", event.detail.id, "success")
        this.recordIdToUpdate = ""  
        
        // fire event to reservation list manager component to refresh datatable
        fireEvent(this.pageRef, "manage_reservation", "RESERVATION_UPDATED")
    }

    get fields() {
        return ["Name", "Reservation_Date__c", "Is_Reservation_Cancelled__c", "Table__c"]
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
}