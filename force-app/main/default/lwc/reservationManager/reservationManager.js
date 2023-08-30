import { LightningElement } from 'lwc';

export default class ReservationManager extends LightningElement {
    selectedOption = "TOMORROW"

    selectedOptionHandler(event) {
        this.selectedOption = event.detail
    }
}