import { Component, OnInit, Input, ElementRef, OnDestroy } from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';
import { delay } from 'rxjs';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnInit, OnDestroy { 

  constructor(public modal: ModalService, public el: ElementRef) {
    
  }

  @Input() modalId: string = ''

  ngOnInit(): void {
    document.body.appendChild(this.el.nativeElement)
  }

  ngOnDestroy(): void {
    document.body.removeChild(this.el.nativeElement)
  }

  closeModal() {
    this.modal.toggleModal(this.modalId)
  }

}
