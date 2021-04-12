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

  emailButtonIconName = "utility:email";
  cardButtonIconName = "utility:send";

  emailButtonTitle = `Send ${this.firstname} a Birthday email`;
  cardButtonTitle = `Send ${this.firstname} a Birthday card`;

  contact;
  firstname;
  birthday;
  showComponent;
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
    }
  }

  isDateUpcoming(date) {
    const dateObj = new Date(date);
    const today = NOW.getUTCDate();
    const difference = dateObj.getUTCDate() - today;
    return difference > 0 && difference <= this.withinDays;
  }

  getBirthdayString(birthdate, includeThisYear) {
    const birthdateObj = new Date(birthdate);
    const birthdateMonth = birthdateObj.getUTCMonth();
    const birthdateDay = birthdateObj.getUTCDate();

    let birthdayString = `${MONTHS[birthdateMonth]} ${birthdateDay}`;
    if (includeThisYear) {
      const thisYear = NOW.getUTCFullYear();
      birthdayString += `${birthdayString}, ${thisYear}`;
    }

    return birthdayString;
  }

  handleEmailButtonClick() {
    this.showSuccessToast(
      `A Happy Birthday Email has been sent to ${this.firstname}`
    );
  }

  handleCardButtonClick() {
    this.showSuccessToast(
      `A Happy Birthday Card has been mailed to ${this.firstname}`
    );
  }

  showSuccessToast(message) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Birthday Success!",
        message,
        variant: "success"
      })
    );
  }
}
