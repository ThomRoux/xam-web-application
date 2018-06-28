import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { XamApiService } from '../xam-api.service';

import * as _ from 'underscore';

@Component({
  selector: 'app-market-overview',
  templateUrl: './market-overview.component.html',
  styleUrls: ['./market-overview.component.css']
})
export class MarketOverviewComponent implements OnInit {

  data: Element[] = [];

  @Input() ptf;
  @Input() model;
  @Input() date;
  @Input() lookback;

  constructor(private api: XamApiService) { }

  ngOnInit() {
    this.api.getMarketData('All').subscribe(data => {
      this.data = _.map(data['items'], (v,k) => {
        var tmp = _.chain(v.series).last().pick('rank','id','name','symbol','price_usd','market_cap_usd','percent_change_1h', 'percent_change_24h','last_updated').value();
        tmp.chart = _.chain(v.series).pluck('price_usd').value();
        return tmp
      });
    });
  }

  ngOnChanges() {
    this.api.getMarketData('All').subscribe(data => {
      this.data = _.map(data['items'], (v,k) => {
        var tmp = _.chain(v.series).last().pick('rank','id','name','symbol','price_usd','market_cap_usd','percent_change_1h', 'percent_change_24h','last_updated').value();
        tmp.chart = _.chain(v.series).pluck('price_usd').value();
        return tmp
      });
    });
  }

  PosNeg(arg) {
    return arg.value>0?' green-500':' red-500';
  }

  decimalDigits(n) {
    var i = Math.min(3,Math.max(0,3-Math.floor(Math.log(n))));
    return '1.'+i+'-'+i;
  }

}
