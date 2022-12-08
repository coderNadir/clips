import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { IUser } from '../models/user.model';
import { Observable, of } from 'rxjs'
import { delay, map, filter, switchMap } from 'rxjs/operators'
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usersCollection: AngularFirestoreCollection<IUser>
  public isAuthenticated$: Observable<Boolean>
  public isAuthenticatedWithDelay$: Observable<Boolean>
  private redirect: Boolean = false

  constructor(
    private auth: AngularFireAuth,
    private db: AngularFirestore,
    private router: Router,
    private route: ActivatedRoute
  ) { 
    // -- set a new collection instance with name
    this.usersCollection = db.collection("users")
    // -- set the user status by operators (rxJs)
    this.isAuthenticated$ = auth.user.pipe(
      map(user => !!user)
    )
    this.isAuthenticatedWithDelay$ = this.isAuthenticated$.pipe(
      delay(1500)
    )
    this.router.events.pipe(
      // -- filter events
      filter((e) => e instanceof NavigationEnd),
      // -- get firstChild (activatedRoute)
      map(e => this.route.firstChild),
      // -- retrieve data from activated Data or return null observable
      switchMap(route => route?.data ?? of({}))
    ).subscribe(
      // -- set property (redirect) value based on retrieved data from activated route
      (data) => this.redirect = data.authOnly ?? false
    )
  }

  public async createUser (userData: IUser) { 
    // -- make sure that we get a password from user
    // -- if you want to enable next guard clause, remove userData.password as string otherwise you don't need the guard clause
    // if (!userData.password) throw new Error("Password not provided!")
    // -- create user with email & password
    const userCred = await this.auth.createUserWithEmailAndPassword(
      userData.email as string , userData.password as string
    )
    // -- register the other data
    await this.usersCollection.doc(userCred.user?.uid).set({
      name: userData.name,
      email: userData.email,
      age: userData.age,
      phoneNumber: userData.phoneNumber
    })

    // -- auth comes with more properties we are going to use it (image, display name)
    await userCred.user?.updateProfile({
      displayName: userData.name
    })
  }

  public async logout($event?: Event) {
    if ($event) $event.preventDefault()
    await this.auth.signOut()
    if (this.redirect) await this.router.navigateByUrl('/')
  }
}
