import { DatePipe } from '@angular/common';
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ClipService } from '../services/clip.service';

@Component({
  selector: 'app-clips-list',
  templateUrl: './clips-list.component.html',
  styleUrls: ['./clips-list.component.css'],
  providers: [DatePipe],
})
export class ClipsListComponent implements OnInit, OnDestroy {
  @Input() scrolable: boolean = true;

  constructor(public clipService: ClipService) {
    this.clipService.getClips();
  }

  ngOnInit(): void {
    if (this.scrolable) {
      window.addEventListener('scroll', this.handleScroll);
    }
  }

  ngOnDestroy(): void {
    if (this.scrolable) {
      window.removeEventListener('scroll', this.handleScroll);
    }

    this.clipService.pageClips = [];
  }

  handleScroll = () => {
    const { offsetHeight, scrollTop } = document.documentElement;
    const { innerHeight } = window;
    const bottomOfWindow = Math.round(scrollTop) + innerHeight === offsetHeight;

    if (bottomOfWindow) {
      this.clipService.getClips();
    }
  };
}
