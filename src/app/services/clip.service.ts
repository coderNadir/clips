import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference,
  QuerySnapshot,
} from '@angular/fire/compat/firestore';
import { map, switchMap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import IClip from '../models/clip.model';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import {
  ActivatedRouteSnapshot,
  Resolve,
  Router,
  RouterStateSnapshot,
} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ClipService implements Resolve<IClip | null> {
  public clipsCollection: AngularFirestoreCollection<IClip>;
  pageClips: IClip[] = [];
  pendingReq: boolean = false;

  constructor(
    private db: AngularFirestore,
    private auth: AngularFireAuth,
    private storage: AngularFireStorage,
    private router: Router
  ) {
    this.clipsCollection = db.collection('clips');
  }

  // -- resolver aren't auto register. we have to manually register it in the router module
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.clipsCollection
      .doc(route.params.id)
      .get()
      .pipe(
        map((snapshot) => {
          const data = snapshot.data();
          // if no data reurn return the function with a null
          if (!data) {
            this.router.navigate(['/']);
            return null;
          }
          // -- else return the data
          return data;
        })
      );
  }

  async getClips() {
    // -- if there is a pending request return
    if (this.pendingReq) return;
    this.pendingReq = true;

    let query = this.clipsCollection.ref.orderBy('timestamp', 'desc').limit(6);

    const { length } = this.pageClips;
    if (length) {
      const lastDocId = this.pageClips[length - 1].docID;
      const lastDoc = await this.clipsCollection
        .doc(lastDocId)
        .get()
        .toPromise();
      query = query.startAfter(lastDoc);
    }

    // -- send request query
    const snapshot = await query.get();
    snapshot.forEach((doc) => {
      this.pageClips.push({
        docID: doc.id,
        ...doc.data(),
      });
    });

    this.pendingReq = false;
  }

  createClip(data: IClip): Promise<DocumentReference<IClip>> {
    return this.clipsCollection.add(data);
  }

  getUserClips(sort: BehaviorSubject<string>) {
    return combineLatest([this.auth.user, sort]).pipe(
      switchMap((values) => {
        const [user, sort] = values;
        // -- check if user is not null
        if (!user) {
          return of([]);
        }
        // -- return clips that the logged in user upload
        const query = this.clipsCollection.ref
          .where('uid', '==', user.uid)
          .orderBy('timestamp', sort === '1' ? 'desc' : 'asc');
        return query.get();
      }),
      map((snapshot) => (snapshot as QuerySnapshot<IClip>).docs)
    );
  }

  updateClip(id: string, title: string) {
    return this.clipsCollection.doc(id).update({
      title,
    });
  }

  async deleteClip(clip: IClip) {
    // -- create a reference to delete
    const clipRef = this.storage.ref(`clips/${clip.fileName}`);
    const screenshotRef = this.storage.ref(
      `screenshots/${clip.screenshotFileName}`
    );
    await clipRef.delete();
    await screenshotRef.delete();
    // -- delete object from db
    await this.clipsCollection.doc(clip.docID).delete();
  }
}
