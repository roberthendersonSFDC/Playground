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

export default class ContactBirthday extends LightningElement {
  @api recordId;
  @api withinDays;
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

  labels = {
    birthdayAnnouncementLabel: "",
    sendEmailButtonLabel: "",
    sendCardButtonLabel: "",
    sendEmailToastHeaderLabel: "",
    sendEmailToastMessageLabel: "",
    sendCardToastHeaderLabel: "",
    sendCardToastMessageLabel: ""
  };

  contact;
  firstname;
  birthday;
  showComponent;
  buttonState;

  @wire(getRecord, { recordId: "$recordId", fields: FIELDS })
  wiredRecord({ error, data }) {
    if (error) {
      let message = "Unknown error";
      if (Array.isArray(error.body)) {
        message = error.body.map((e) => e.message).join(", ");
      } else if (typeof error.body.message === "string") {
        message = error.body.message;
      }
      this.dispatchEvent(
        new ShowToastEvent({
          title: "Error loading contact",
          message,
          variant: "error"
        })
      );
    } else if (data) {
      this.contact = data;
      this.firstname = this.contact.fields.FirstName.value;
      this.birthday = this.getBirthdayString(
        this.contact.fields.Birthdate.value
      );
      this.showComponent = this.isDateUpcoming(
        this.contact.fields.Birthdate.value
      );
      this.addDataToLabels();
      this.buttonState = this.getInitialButtonState();
    }
  }

  addDataToLabels() {
    for (const property in this.labels) {
      let label = this.labels[property].slice();
      if (label.indexOf("{FirstName}") > -1) {
        label = label.replaceAll("{FirstName}", this.firstname);
      }
      if (label.indexOf("{Birthdate}") > -1) {
        label = label.replaceAll("{Birthdate}", this.birthday);
      }
      this.labels[property] = label;
    }
  }

  isDateUpcoming(date) {
    const dateObj = new Date(this.getBirthdayString(date, true));
    const differenceInTime = dateObj.getTime() - NOW.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    return differenceInDays > 0 && differenceInDays <= this.withinDays;
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

  replaceDataPlaceholders(value) {
    let formattedValue = value.slice();
    if (formattedValue.indexOf("{FirstName}") > -1) {
      formattedValue.replaceAll("{FirstName}", this.firstname);
    }
    if (formattedValue.indexOf("{Birthdate}") > -1) {
      formattedValue.replaceAll("{Birthdate}", this.birthday);
    }
    return formattedValue;
  }

  handleEmailButtonClick() {
    let newState = Object.assign({}, this.buttonState);
    newState.email.disabled = true;
    newState.email.iconName = "utility:check";
    this.buttonState = newState;
    this.showSuccessToast(
      this.labels.sendEmailToastHeaderLabel,
      this.labels.sendEmailToastMessageLabel
    );
  }

  handleCardButtonClick() {
    let newState = Object.assign({}, this.buttonState);
    newState.card.disabled = true;
    newState.card.iconName = "utility:check";
    this.buttonState = newState;
    this.showSuccessToast(
      this.labels.sendCardToastHeaderLabel,
      this.labels.sendCardToastMessageLabel
    );
  }

  showSuccessToast(header, message) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: header,
        message,
        variant: "success"
      })
    );
  }
}
