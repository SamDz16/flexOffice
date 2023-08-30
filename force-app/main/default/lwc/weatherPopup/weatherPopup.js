import { LightningElement, api } from "lwc"

export default class WeatherPopup extends LightningElement {

    @api weatherdata

    isShowModal = true
    userChoice

    handleUserChoice(event) {  
        this.isShowModal = false
        this.userChoice = event.target.value
        this.dispatchEvent(new CustomEvent("userchoice", {detail: this.userChoice}))
    }

    get cityName() {
        if(this.weatherdata) {
            return this.weatherdata.cityName
        }
    }

    get climat() {
        return this.weatherdata.climat
        
    }

    get description() {
        return this.weatherdata.description
    }
}