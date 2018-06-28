import { Component, OnInit } from '@angular/core';
import { XamApiService } from '../xam-api.service';

import * as moment from 'moment';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: [
    './navbar.component.css',
    "../../../node_modules/primeng/resources/themes/bootstrap/theme.css",
    "../../../node_modules/primeng/resources/primeng.min.css"
  ]
})
export class NavbarComponent implements OnInit {

  portfolioList: any = [];

  durations = [
    {name: '1 Months', code: 'P1M'},
    {name: '2 Months', code: 'P2M'},
    {name: '3 Months', code: 'P3M'}
  ];

  constructor(private api: XamApiService) { }

  ngOnInit() {
    this.api.getPortflioList().subscribe(data => this.portfolioList=data);
  }

  clearForDateMinutes(event) {
    this.api.date = event;
  }
  clearAsOfDateMinutes(event) {
    this.api.asOfDate = event;
  }
  clearAsOfDate() {
    this.api.asOfDate = null;
  }

}
