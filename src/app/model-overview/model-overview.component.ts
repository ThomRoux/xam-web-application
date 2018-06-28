import { Component, OnInit, Input, ViewChild } from '@angular/core';

import { XamApiService } from '../xam-api.service';

import * as _ from 'underscore';
import * as ss from 'simple-statistics';

@Component({
  selector: 'app-model-overview',
  templateUrl: './model-overview.component.html',
  styleUrls: ['./model-overview.component.css']
})
export class ModelOverviewComponent implements OnInit {

  rawdata: any = [];
  data: any = [];
  covariance: any = [];

  loading: boolean = true;

  @Input() factorData;

  colorScheme = {
    domain: ['#A10A28','#5AA454']
  };

  constructor(private api: XamApiService) { }

  ngOnInit() {}

  ngOnChanges() {
    this.loading = true;
    if (this.factorData!=null) {
      this.data = _.chain(this.factorData.levels).mapObject((v,k) => {
        return {
          name: k,
          series: _.chain(v).rest().zip(this.factorData.returns['timestamp']).map(i => { return {name: new Date(i[1]), value: Math.log10(i[0])}}).value()
        }
      }).values().value();
      this.covariance = _.chain(this.factorData.names)
        .map((v,i) => _.chain(this.factorData.names).object(this.factorData.covariance[i]||0)
          .mapObject((val,k) => val/(this.factorData.stddev[v]*this.factorData.stddev[k]) )
          .extend({factor: v})
          .value()
        ).value();
      this.loading = false;
    }

  }

  CorrelationColor(arg) {
    var tmp = Math.floor(5*arg);
    switch(tmp) {
      case -5: return ' red-500';
      case -4: return ' red-400';
      case -3: return ' red-300';
      case -2: return ' red-200';
      case -1: return ' red-100';
      case 0: return ' green-100';
      case 1: return ' green-200';
      case 2: return ' green-300';
      case 3: return ' green-400';
      case 4: return ' green-500';
      default: return '';
    }
  }

}
