import { AngularFireAuth } from "@angular/fire/compat/auth";
import { Injectable } from "@angular/core";
import { AbstractControl, AsyncValidator, ValidationErrors } from "@angular/forms";

// -- custom classes that we create we should import the injectable decorator to use dependency injection and tell angular we want to inject it into our app by setting (providedIn: 'root')
@Injectable({
    providedIn: 'root'
})
export class EmailTaken implements AsyncValidator {
    constructor(private auth: AngularFireAuth) {
    }

    // -- must be an arrow function to be able to use the "this" keyword and be pointed to the class
    validate = async (control: AbstractControl): 
        Promise<ValidationErrors | null> => {
        const
            // -- (fetch...) method will return an array of string if email does not exists in DB otherwise it returns empty array
            response = await this.auth.fetchSignInMethodsForEmail(control.value);
        return response.length ? { emailTaken: true } : null;
    }
}
