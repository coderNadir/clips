import { ValidationErrors, AbstractControl } from "@angular/forms";

export class RegisterValidators {
    // -- static method doesn't need to create an instance out of the class to be invoked
    // -- static method has limitation in its scope (it doesn't have access to class properties or methods)
    static match(controlName: string, matchingControlName: string) {
        return (group: AbstractControl) : ValidationErrors | null => {
            const control = group.get(controlName)
            const matchingControl = group.get(matchingControlName)
    
            // -- check if both controls found
            if (!control || !matchingControl) {
                console.error("Matching controls not found!")
                return { controlNotFound: true}
            }
    
            // -- are controls match
            const error = control!.value === matchingControl!.value 
            ? null : { noMatch: true }
            // -- set error in matching control to be used as error
            matchingControl.setErrors(error)
            return error
        }
    }
}
