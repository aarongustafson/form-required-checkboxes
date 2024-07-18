class FormRequiredCheckboxesElement extends HTMLElement {
	connectedCallback() {
		this.__element_name = this.nodeName.toLowerCase();
		this.__$checkboxes = this.querySelectorAll("[type='checkbox']");
		this.__field_name = this.__$checkboxes[0].name;
		this.__notice = this.getAttribute("notice");
		this.__error = this.getAttribute("error");
		this.__$fieldset = this.querySelector("fieldset");
		this.__$legend = this.querySelector("legend");
		this.__getMinMax();
		this.__addDescription();
		this.__setupAccessibleName();
		this.__setupValidation();
	}
	
	__getMinMax() {
		let required = this.getAttribute("required");
		if ( ! required ) {
			throw new Error("You must specify a `required` number of checkbox choices in a `checkbox-required` element");
			return;
		}
		if ( required.indexOf('-') > 0 ) {
			[this.__min, this.__max] = required.split("-");
		} else {
			this.__min = required;
			this.__max = required;
		}
	}
	
	__addDescription() {
		this.__$description = document.createElement("small");
		this.__$description.id = `${this.__field_name.replace("[]", "")}-description`;
		if (! this.__notice) {
			if ( this.__min == this.__max ) {
				this.__notice = `Choose ${this.__min} from the list`;
			} else if ( this.__min === 0 ) {
				this.__notice = `Choose up to ${this.__max} from the list`;
			} else {
				this.__notice = `Choose between ${this.__min} and ${this.__max} from the list`;
			}
		}
		this.__$description.innerText = this.__notice;
		(this.__$fieldset ? this.__$fieldset : this).appendChild(this.__$description);
	}

	__setupAccessibleName() {
		if (this.__$legend && !this.__$legend.id) {
			this.__$legend.id = `${this.__field_name.replace("[]", "")}-legend`;
		}
		(this.__$fieldset ? this.__$fieldset : this).setAttribute("aria-labelledby", `${this.__$legend ? this.__$legend.id : ""} ${this.__$description.id}`);
	}
	
	__setupValidation() {
		this.__$form = this.closest("form");
		this.__$form.addEventListener("formdata", this.__handleValidation.bind(this));
		this.__$form.addEventListener("submit", this.__handleValidation.bind(this));
		[...this.__$checkboxes].map(input => input.addEventListener("change", this.__resetValidity.bind(this)));
	}
	
	__handleValidation( e ) {
		let total_checked = [...this.__$checkboxes].filter(input => input.checked).length;
		if ( total_checked < this.__min || total_checked > this.__max ) {
			e.preventDefault();
			this.__$checkboxes[0].setCustomValidity(this.__error ?  this.__error : this.__notice);
			if ( this.__shouldShowFieldError(this.__$checkboxes[0]) ) {
				this.__$checkboxes[0].reportValidity();
			}
		}
	}
	
	__shouldShowFieldError( input ) {
		let $all_fields = [...this.__$form.elements].filter(element => element.matches("input:not([type=submit],[type=reset]),textarea,select"));
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
	
	__resetValidity() {
		[...this.__$form.querySelectorAll(`${this.__element_name} [type=checkbox]`)]
			 .map(input =>  input.setCustomValidity(""));
	}
	
}

if( !!customElements ) {
	customElements.define("form-required-checkboxes", FormRequiredCheckboxesElement);
}
