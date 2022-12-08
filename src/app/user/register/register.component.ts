import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { IUser } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { RegisterValidators } from '../validators/register-validators';
import { EmailTaken } from '../validators/email-taken';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {

  alertColor = 'blue'
  showAlert = false
  alertMessage = ''
  inSubmission = false

  constructor(
    private authService: AuthService,
    private emailTaken: EmailTaken
  ) {}

  // -- form controls
  name  = new FormControl('', [
    Validators.required,
    Validators.minLength(3)
  ])
  email = new FormControl('', [
    Validators.email,
    Validators.required,
    Validators.email
  ], [
    // -- third argument for async validators.
    // -- async validators runs after sync validators finish
    this.emailTaken.validate
  ])
  age = new FormControl<number| null>(null, [
    Validators.required,
    Validators.min(18),
    Validators.max(80)
  ])
  password = new FormControl('', [
    Validators.required,
    Validators.pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
  ])    
  confirmPassword = new FormControl('', [
    Validators.required
  ])  
  phoneNumber = new FormControl('', [
    Validators.required, 
    Validators.minLength(14),
    Validators.maxLength(14)
  ])

  // -- register form
  registerForm = new FormGroup({
    name: this.name,
    email: this.email,
    age: this.age,
    password: this.password,
    confirmPassword: this.confirmPassword, 
    phoneNumber: this.phoneNumber
  },
  // -- second argument is optional. we can pass a validator and it'll be applied to the whole controls
  RegisterValidators.match("password", "confirmPassword") 
  )

  async register() {
    this.showAlert = true
    this.alertMessage = 'Please wait! Your account is being created...'
    this.alertColor = 'blue'
    // -- disable submit button while submitting the form
    this.inSubmission = true

    try {
      // -- create user
      await this.authService.createUser(this.registerForm.value as IUser)
    } catch (err ) {
      this.alertMessage = "An unexpected error occurred. Please try again later!"
      this.alertColor = "red"
      // -- reset submit button to enable user to sign up again
      this.inSubmission = false
      console.log("ERROR: ", err)
      // -- return to not let the function continue executing
      return
    }
    // -- set custom message and success color bg
    this.alertMessage = "Success! your account has been created."
    this.alertColor = "green"
  }
}
