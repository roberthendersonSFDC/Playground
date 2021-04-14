import { api, LightningElement, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getRecord } from "lightning/uiRecordApi";

const FIELDS = ["Contact.FirstName", "Contact.Birthdate"];
const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];
const NOW = new Date();
const alphaNumericMatch = /^[a-z0-9]+$/i;

export default class ContactBirthday extends LightningElement {
    labels = {
        birthdayAnnouncementLabel: "",
        sendEmailButtonLabel: "",
        sendCardButtonLabel: "",
        sendEmailToastHeaderLabel: "",
        sendEmailToastMessageLabel: "",
        sendCardToastHeaderLabel: "",
        sendCardToastMessageLabel: ""
    };

    @api
    recordId;

    @api
    withinDays;

    @api
    emoticonUnicode;

    @api
    set birthdayAnnouncementLabel(value) {
        this.labels.birthdayAnnouncementLabel = value;
    }
    get birthdayAnnouncementLabel() {
        return this.labels.birthdayAnnouncementLabel;
    }

    @api
    set sendEmailButtonLabel(value) {
        this.labels.sendEmailButtonLabel = value;
    }
    get sendEmailButtonLabel() {
        return this.labels.sendEmailButtonLabel;
    }

    @api
    set sendCardButtonLabel(value) {
        this.labels.sendCardButtonLabel = value;
    }
    get sendCardButtonLabel() {
        return this.labels.sendCardButtonLabel;
    }

    @api
    set sendEmailToastHeaderLabel(value) {
        this.labels.sendEmailToastHeaderLabel = value;
    }
    get sendEmailToastHeaderLabel() {
        return this.labels.sendEmailToastHeaderLabel;
    }

    @api
    set sendEmailToastMessageLabel(value) {
        this.labels.sendEmailToastMessageLabel = value;
    }
    get sendEmailToastMessageLabel() {
        return this.labels.sendEmailToastMessageLabel;
    }

    @api
    set sendCardToastHeaderLabel(value) {
        this.labels.sendCardToastHeaderLabel = value;
    }
    get sendCardToastHeaderLabel() {
        return this.labels.sendCardToastHeaderLabel;
    }

    @api
    set sendCardToastMessageLabel(value) {
        this.labels.sendCardToastMessageLabel = value;
    }
    get sendCardToastMessageLabel() {
        return this.labels.sendCardToastMessageLabel;
    }

    @api
    backgroundColorHex;

    @api
    borderColorHex;

    firstname;
    birthday;
    showComponent;
    buttonState;

    @wire(getRecord, { recordId: "$recordId", fields: FIELDS })
    wiredRecord({ error, data }) {
        if (error) {
            this.handleWiredContactError(error);
        } else if (data) {
            this.handleWiredContactSuccess(data);
        }
    }

    handleWiredContactError(error) {
        let message = "Unknown error";
        if (Array.isArray(error.body)) {
            message = error.body.map((e) => e.message).join(", ");
        } else if (typeof error.body.message === "string") {
            message = error.body.message;
        }
        this.showToast("Error loading Contact", message, "error");
    }

    handleWiredContactSuccess(data) {
        const fields = data.fields;
        this.firstname = fields.FirstName.value;
        this.birthday = this.getBirthdayString(fields.Birthdate.value);
        this.showComponent = this.isDateUpcoming(fields.Birthdate.value);
        this.bindDataToLabels();
        this.emoticon = this.createEmoticonCode();
        this.wrapperStyles = this.createCssRules();
        this.buttonState = this.getInitialButtonState();
    }

    getBirthdayString(birthdate, includeThisYear) {
        const birthdateObj = new Date(birthdate);
        const birthdateMonth = birthdateObj.getUTCMonth();
        const birthdateDay = birthdateObj.getUTCDate();

        let birthdayString = `${MONTHS[birthdateMonth]} ${birthdateDay}`;
        if (includeThisYear) {
            const thisYear = NOW.getUTCFullYear();
            birthdayString = `${birthdayString}, ${thisYear}`;
        }

        return birthdayString;
    }

    isDateUpcoming(date) {
        const dateObj = new Date(this.getBirthdayString(date, true));
        const differenceInTime = dateObj.getTime() - NOW.getTime();
        const differenceInDays = differenceInTime / (1000 * 3600 * 24);
        return differenceInDays > 0 && differenceInDays <= this.withinDays;
    }

    bindDataToLabels() {
        for (const property in this.labels) {
            let label = this.labels[property].slice();
            const swaps = [
                { token: "{FirstName}", targetProp: "firstname" },
                { token: "{Birthdate}", targetProp: "birthday" }
            ];
            swaps.forEach((swap) => {
                if (label.indexOf(swap.token) > -1) {
                    label = label.replaceAll(swap.token, this[swap.targetProp]);
                }
            });
            this.labels[property] = label;
        }
    }

    createEmoticonCode() {
        const prefix = "&#x";
        const defaultCode = "1F973";
        if (this.emoticonUnicode.length !== 5) {
            return prefix + defaultCode;
        }
        if (this.emoticonUnicode.match(alphaNumericMatch) === null) {
            return prefix + defaultCode;
        }
        return prefix + this.emoticonUnicode;
    }

    createCssRules() {
        let backgroundColor = this.checkColorHexValidity(
            "backgroundColorHex",
            "#cdefc4"
        );
        let borderColor = this.checkColorHexValidity(
            "borderColorHex",
            "#2e844a"
        );

        return `background-color: ${backgroundColor}; border-color: ${borderColor};`;
    }

    checkColorHexValidity(targetProp, defaultHex) {
        if (this[targetProp].length > 7) {
            return defaultHex;
        }
        if (this[targetProp].charAt(0) !== "#") {
            return defaultHex;
        }
        if (this[targetProp].slice(1).match(alphaNumericMatch) === null) {
            return defaultHex;
        }
        return this[targetProp];
    }

    getInitialButtonState() {
        return {
            email: {
                label: this.labels.sendEmailButtonLabel,
                title: `Send ${this.firstname} a Birthday email`,
                iconName: "utility:email",
                disabled: false
            },
            card: {
                label: this.labels.sendCardButtonLabel,
                title: `Send ${this.firstname} a Birthday card`,
                iconName: "utility:send",
                disabled: false
            }
        };
    }

    handleEmailButtonClick() {
        this.updateButtonState("email", true);
    }

    handleCardButtonClick() {
        this.updateButtonState("card", true);
    }

    updateButtonState(type, showToast) {
        let newState = Object.assign({}, this.buttonState);
        newState[type].disabled = true;
        newState[type].iconName = "utility:check";
        this.buttonState = newState;
        if (showToast) {
            this.showToast(
                this.labels[
                    `send${this._capitalizeFirstLetter(type)}ToastHeaderLabel`
                ],
                this.labels[
                    `send${this._capitalizeFirstLetter(type)}ToastMessageLabel`
                ],
                "success"
            );
        }
    }

    showToast(title, message, variant) {
        this.dispatchEvent(
            new ShowToastEvent({
                title,
                message,
                variant
            })
        );
    }

    _capitalizeFirstLetter(word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }
}
