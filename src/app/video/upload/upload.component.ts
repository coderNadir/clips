import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { v4 as uuid } from 'uuid';
import { last, switchMap } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {
  isDragover: boolean = false
  isVideoDropped: boolean = false
  file: File | null = null
  alertColor: string = 'blue'
  alertMsg: string = 'Please wait! your clip ie being uploaded.'
  alertShow: boolean = false
  inSubmission: boolean = false
  percentage: number = 0
  showPercentage: boolean = true
  user: firebase.User | null = null 

  titleControl = new FormControl('', {
    validators: [
      Validators.required,
      Validators.minLength(3)
    ],
    //-- default angular allows null value, we don't want that so we are going to disable the default by setting next property
    nonNullable: true
  })

  uploadForm = new FormGroup({
    title: this.titleControl
  })

  constructor(
    private storage: AngularFireStorage,
    private auth: AngularFireAuth
  ) {
    auth.user.subscribe(user => this.user = user)
  }

  ngOnInit(): void {
  }

  storeFile($event: Event) {
    this.isDragover = false
    this.file = ($event as DragEvent).dataTransfer?.files.item(0) ?? null
    if (!this.file || this.file.type != 'video/mp4') return
    this.isVideoDropped = true
    this.titleControl.setValue(
      this.file.name.replace(/\.[^/.]+$/, '')
    )
  }

  uploadFile() {
    this.alertColor = 'blue'
    this.alertShow = true
    this.alertMsg = 'Please wait! your clip is being uploaded.'
    this.inSubmission = true
    const clipFileName = uuid()
    const clipPath = `clips/${clipFileName}.mp4`
    const task = this.storage.upload(clipPath, this.file)
    const clipRef = this.storage.ref(clipPath)

    task.percentageChanges().subscribe(progress => {
      this.percentage = progress as number / 100
    })
    task.snapshotChanges().pipe(
      // -- last() will push the last value pushed by the observable after the observable complete.
      last(),
      switchMap(() => clipRef.getDownloadURL())
    ).subscribe({
      next: (url) => {
        // -- create an object contains info about the user and the upload
        const clip = {
          uid: this.user?.uid,
          displayName: this.user?.displayName,
          title: this.titleControl.value,
          fileName: `${clipFileName}.mp4`,
          // -- create a reference url to be able to access the file
          url
        }

        console.log(clip)
        this.showPercentage = false
        this.alertColor = 'green'
        this.alertMsg = 'Success! You can now share your clip with the world.'
        
      },
      error: (error) => {
        this.showPercentage = false
        this.alertColor = 'red'
        this.alertMsg = 'Failed to upload your clip, try again in a while.'
        console.error("💥 ERROR: ", error)
      } 
    })
  }

}
