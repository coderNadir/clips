import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges,
  EventEmitter,
  Output,
} from '@angular/core';
import IClip from 'src/app/models/clip.model';
import { ModalService } from 'src/app/services/modal.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ClipService } from 'src/app/services/clip.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css'],
})
export class EditComponent implements OnInit, OnDestroy, OnChanges {
  inSubmission: boolean = false;
  alertShow: boolean = false;
  alertColor: string = 'blue';
  alertMsg: string = 'Please wait. Updating...';

  @Input() activeClip: IClip | null = null;
  @Output() updateEvent = new EventEmitter();

  // -- controls
  clipID = new FormControl('', {
    nonNullable: true,
  });
  title = new FormControl('', {
    validators: [Validators.required, Validators.minLength(3)],
    nonNullable: true,
  });
  // -- formGroup
  editForm = new FormGroup({
    id: this.clipID,
    title: this.title,
  });

  constructor(private modal: ModalService, private clipService: ClipService) {}

  ngOnInit(): void {
    this.modal.register('editClip');
  }

  ngOnDestroy(): void {
    this.modal.unregister('editClip');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.activeClip) return;
    // -- reset to default
    this.inSubmission = false;
    this.alertShow = false;
    // -- set values passed in
    this.title.setValue(this.activeClip.title!);
    this.clipID.setValue(this.activeClip.docID!);
  }

  async submit() {
    // -- if activeClip is null return
    if (!this.activeClip) return;
    // -- let user know that we are processing his request
    this.inSubmission = true;
    this.alertShow = true;
    this.alertColor = 'blue';
    this.alertMsg = 'Please wait. Updating...';
    try {
      // -- send the request
      await this.clipService.updateClip(this.clipID.value, this.title.value);
    } catch (err) {
      // -- in case of error show error message
      this.inSubmission = false;
      this.alertColor = 'red';
      this.alertMsg = 'Something went wrong, please try later';
      return;
    }

    // -- set new value and output it
    this.activeClip.title = this.title.value;
    this.updateEvent.emit(this.activeClip);

    // -- show success message
    this.inSubmission = false;
    this.alertColor = 'green';
    this.alertMsg = 'Success!';
  }
}
