import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AlertComponent } from 'src/app/shared/alert/alert.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  alertColor = ''
  alertMessage = ''
  showAlert = false
  inSubmission = false

  credentials = {
    email: '',
    password: ''
  }

  constructor(private auth: AngularFireAuth) { }

  ngOnInit(): void {
  }

  async login() {
    this.alertColor = 'blue'
    this.alertMessage = 'Signing in...'
    this.showAlert = true
    this.inSubmission = true
    try {
      await this.auth.signInWithEmailAndPassword(
        this.credentials.email,
        this.credentials.password
      )
      
    }catch (err) {
      this.inSubmission = false
      console.log("ERROR: ", err)
      this.alertColor = 'red'
      this.alertMessage = 'Wrong email or password!'
      this.showAlert = true 
      return
    }
    this.alertColor = 'green'
    this.alertMessage = 'Logged in successfully!'
  }

}
