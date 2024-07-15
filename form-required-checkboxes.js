class FormRequiredCheckboxesElement extends HTMLElement {
	connectedCallback() {
		this.element_name = this.nodeName.toLowerCase();
		this.$checkboxes = this.querySelectorAll("[type='checkbox']");
		this.field_name = this.$checkboxes[0].name;
		this.notice = this.getAttribute("notice");
		this.error = this.getAttribute("error");
		this.$fieldset = this.querySelector("fieldset");
		this.$legend = this.querySelector("fieldset");
		this.getMinMax();
		this.addDescription();
		this.setupAccessibleName();
		this.setupValidation();
	}
	
	getMinMax() {
		let required = this.getAttribute("required");
		if ( ! required ) {
			throw new Error("You must specify a `required` number of checkbox choices in a `checkbox-required` element");
			return;
		}
		if ( required.indexOf('-') > 0 ) {
			[this.min, this.max] = required.split("-");
		} else {
			this.min = required;
			this.max = required;
		}
	}
	
	addDescription() {
		this.$description = document.createElement("small");
		this.$description.id = `${this.field_name.replace("[]", "")}-description`;
		if (! this.notice) {
			if ( this.min == this.max ) {
				this.notice = `Choose ${this.min} from the list`;
			} else if ( this.min === 0 ) {
				this.notice = `Choose up to ${this.max} from the list`;
			} else {
				this.notice = `Choose between ${this.min} and ${this.max} from the list`;
			}
		}
		this.$description.innerText = this.notice;
		(this.$fieldset ? this.$fieldset : this).appendChild(this.$description);
	}

	setupAccessibleName() {
		if (this.$legend && !this.$legend.id) {
			this.$legend.id = `${this.field_name.replace("[]", "")}-legend`;
		}
		(this.$fieldset ? this.$fieldset : this).setAttribute("aria-labelledby", `${this.$legend ? this.$legend.id : ""} ${this.$description.id}`);
	}
	
	setupValidation() {
		this.$form = this.closest("form");
		this.$form.addEventListener("formdata", this.handleValidation.bind(this));
		this.$form.addEventListener("submit", this.handleValidation.bind(this));
		[...this.$checkboxes].map(input => input.addEventListener("change", this.resetValidity.bind(this)));
	}
	
	handleValidation( e ) {
		let total_checked = [...this.$checkboxes].filter(input => input.checked).length;
		if ( total_checked < this.min || total_checked > this.max ) {
			e.preventDefault();
			this.$checkboxes[0].setCustomValidity(this.error ?  this.error : this.notice);
			if ( this.shouldShowFieldError(this.$checkboxes[0]) ) {
				this.$checkboxes[0].reportValidity();
			}
		}
	}
	
	shouldShowFieldError( input ) {
		let $all_fields = [...this.$form.elements].filter(element => element.matches("input:not([type=submit],[type=reset]),textarea,select"));
		let i = 0;
		let length = $all_fields.length;
		while ( i < length ) {
			// this field should throw the error
			if ( $all_fields[i].name == input.name ) {
				return true;
			}
			// another field should throw the error
			if ( !$all_fields[i].validity.valid ) {
				return false;
			}
			i++;
		}
		return true;
	}
	
	resetValidity() {
		[...this.$form.querySelectorAll(`${this.element_name} [type=checkbox]`)]
			 .map(input =>  input.setCustomValidity(""));
	}
	
}

if("customElements" in window) {
	window.customElements.define("form-required-checkboxes", FormRequiredCheckboxesElement);
}