import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, Params } from '@angular/router';
import { map } from 'rxjs/operators';
import IClip from 'src/app/models/clip.model';
import { ClipService } from 'src/app/services/clip.service';
import { ModalService } from 'src/app/services/modal.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css'],
})
export class ManageComponent implements OnInit {
  orderVideo: string = '';
  clips: IClip[] = [];
  activeClip: IClip | null = null;
  sort$: BehaviorSubject<string>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clipService: ClipService,
    private modal: ModalService
  ) {
    this.sort$ = new BehaviorSubject(this.orderVideo);
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params: Params) => {
      this.orderVideo = params.get('sort') === '2' ? params.get('sort') : '1';
      this.sort$.next(this.orderVideo);
    });

    // -- retrieve the data from db
    this.clipService.getUserClips(this.sort$).subscribe((docs) => {
      this.clips = [];
      // -- loop through the pushed array and assign the data to (clips)
      docs.forEach((doc) => {
        this.clips.push({
          // -- add docID to be able to use it in update
          docID: doc.id,
          ...doc.data(),
        });
      });
    });
  }

  sort(event: Event) {
    const { value } = event.target as HTMLSelectElement;
    // this.router.navigateByUrl(`/manage?sort=${value}`)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sort: value,
      },
    });
  }

  openModal(event: Event, clip: IClip) {
    event.preventDefault();
    this.modal.toggleModal('editClip');
    this.activeClip = clip;
    console.log('');
  }

  update($event: IClip) {
    this.clips.forEach((element, index) => {
      if (element.docID == $event.docID) {
        element.title = $event.title;
      }
    });
  }

  deleteClip($event: Event, clip: IClip) {
    $event.preventDefault();
    this.clipService.deleteClip(clip);
    this.clips.forEach((element, index) => {
      if (element.docID == clip.docID) {
        this.clips.splice(index, 1);
      }
    });
  }

  async copyToClipboard(event: Event, docID: string | undefined) {
    event.preventDefault();

    if (!docID) return;

    const url = `${location.origin}/clip/${docID}`;
    await navigator.clipboard.writeText(url);

    alert('Link copied!');
  }
}
