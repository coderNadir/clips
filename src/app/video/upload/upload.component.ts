import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AngularFireStorage,
  AngularFireUploadTask,
} from '@angular/fire/compat/storage';
import { v4 as uuid } from 'uuid';
import { switchMap } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { ClipService } from 'src/app/services/clip.service';
import { Router } from '@angular/router';
import { FfmpegService } from 'src/app/services/ffmpeg.service';
import { combineLatest, forkJoin } from 'rxjs';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
})
export class UploadComponent implements OnDestroy {
  isDragover: boolean = false;
  isVideoDropped: boolean = false;
  file: File | null = null;
  alertColor: string = 'blue';
  alertMsg: string = 'Please wait! your clip ie being uploaded.';
  alertShow: boolean = false;
  inSubmission: boolean = false;
  percentage: number = 0;
  showPercentage: boolean = true;
  user: firebase.User | null = null;
  task?: AngularFireUploadTask;
  screenshots: string[] = [];
  selectedScreenshot: string = '';
  screenshotTask?: AngularFireUploadTask;

  titleControl = new FormControl('', {
    validators: [Validators.required, Validators.minLength(3)],
    //-- default angular allows null value, we don't want that so we are going to disable the default by setting next property
    nonNullable: true,
  });

  uploadForm = new FormGroup({
    title: this.titleControl,
  });

  constructor(
    private storage: AngularFireStorage,
    private auth: AngularFireAuth,
    private clipService: ClipService,
    private router: Router,
    public ffmpegService: FfmpegService
  ) {
    auth.user.subscribe((user) => (this.user = user));
    this.ffmpegService.init();
  }

  ngOnDestroy(): void {
    // -- cancel upload in case the user navigate to another page
    this.task?.cancel();
  }

  async storeFile($event: Event) {
    if (this.ffmpegService.isRunning) return;
    this.isDragover = false;
    this.file = ($event as DragEvent).dataTransfer
      ? ($event as DragEvent).dataTransfer?.files.item(0) ?? null
      : ($event.target as HTMLInputElement).files?.item(0) ?? null;
    if (!this.file || this.file.type != 'video/mp4') return;
    this.screenshots = await this.ffmpegService.getScreenshots(this.file);
    this.selectedScreenshot = this.screenshots[0];
    this.isVideoDropped = true;
    this.titleControl.setValue(this.file.name.replace(/\.[^/.]+$/, ''));
  }

  async uploadFile() {
    // -- disable form controls while uploading
    this.uploadForm.disable();
    // -- set values
    this.alertColor = 'blue';
    this.alertShow = true;
    this.alertMsg = 'Please wait! your clip is being uploaded.';
    this.inSubmission = true;
    const clipFileName = uuid();
    const clipPath = `clips/${clipFileName}.mp4`;

    const screenshotBlob = await this.ffmpegService.blobFromURL(
      this.selectedScreenshot
    );
    const screenshotPath = `screenshots/${clipFileName}.png`;

    this.task = this.storage.upload(clipPath, this.file);
    const clipRef = this.storage.ref(clipPath);

    // -- upload screenshot
    this.screenshotTask = this.storage.upload(screenshotPath, screenshotBlob);
    const screenshotRef = this.storage.ref(screenshotPath);

    // -- track upload progress
    combineLatest([
      this.task?.percentageChanges(),
      this.screenshotTask.percentageChanges(),
    ]).subscribe((progress) => {
      const [clipProgress, screenshotProgress] = progress;
      if (!clipProgress || !screenshotProgress) return;

      const total = clipProgress + screenshotProgress;

      this.percentage = (total as number) / 200;
    });
    // -- subscribe to snapshot changes / get download url obervable // store clip data / show sucess
    forkJoin([
      this.task?.snapshotChanges(),
      this.screenshotTask.snapshotChanges(),
    ])
      .pipe(
        switchMap(() =>
          forkJoin([clipRef.getDownloadURL(), screenshotRef.getDownloadURL()])
        )
      )
      .subscribe({
        next: async (urls) => {
          const [clipURL, screenshotURL] = urls;
          // -- create an object contains info about the user and the upload
          console.log('user object: ', this.user);
          const clip = {
            uid: this.user?.uid as string,
            displayName: this.user?.displayName as string,
            title: this.titleControl.value,
            fileName: `${clipFileName}.mp4`,
            // -- create a reference url to be able to access the file
            url: clipURL,
            screenshotURL,
            screenshotFileName: `${clipFileName}.png`,
            // -- adding timestamp to be used in sorting
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          };
          console.log(clip);

          // -- store the clip object
          const clipDocRef = await this.clipService.createClip(clip);
          this.showPercentage = false;
          this.alertColor = 'green';
          this.alertMsg =
            'Success! You can now share your clip with the world.';
          // -- redirect user after a successful upload
          setTimeout(() => {
            this.router.navigate(['clip', clipDocRef.id]);
          }, 1000);
        },
        // -- handle errors
        error: (error) => {
          // -- enable form again
          this.uploadForm.enable();
          this.showPercentage = false;
          this.alertColor = 'red';
          this.alertMsg = 'Failed to upload your clip, try again in a while.';
          console.error('💥 ERROR: ', error);
        },
      });
  }
}
