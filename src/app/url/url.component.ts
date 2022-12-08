import { Component, OnInit } from '@angular/core';
import { HttpParameterCodec } from '@angular/common/http'
import { ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-url',
  templateUrl: './url.component.html',
  styleUrls: ['./url.component.css']
})
export class UrlComponent implements OnInit {
  sort: boolean = true

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: Params) => {
      console.log("params: ", params?.player)
    })

    this.route.params.subscribe((params) => {
      console.log("params: ", params)
    })
  }

}
