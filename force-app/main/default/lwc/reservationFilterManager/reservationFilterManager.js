import { LightningElement } from "lwc"

export default class ReservationFilterManager extends LightningElement {
    options = [
        { label: "Tous", value: "ALL" },
        { label: "Hier", value: "YESTERDAY" },
        { label: "Aujourd'hui", value: "TODAY" },
        { label: "Demain", value: "TOMORROW" },
        { label: "Cette semaine", value: "THIS_WEEK" },
    ]

    selectedOption = "TOMORROW"

    handleChange(event) {
        this.selectedOption = event.detail.value
        this.dispatchEvent(new CustomEvent("filter", {detail: this.selectedOption}))
    }
}