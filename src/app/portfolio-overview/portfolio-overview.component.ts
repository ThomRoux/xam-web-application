import { Component, OnInit, ViewChild, Input } from '@angular/core';

import { XamApiService } from '../xam-api.service';

import * as _ from 'underscore';
import * as ss from 'simple-statistics';
import * as cov from 'compute-covariance';

import * as qp from 'quadprog';
import * as math from 'mathjs';

//import * as d3 from 'd3';
import { curveLinear, curveNatural, curveMonotoneX } from 'd3-shape';

@Component({
  selector: 'app-portfolio-overview',
  templateUrl: './portfolio-overview.component.html',
  styleUrls: ['./portfolio-overview.component.css']
})
export class PortfolioOverviewComponent implements OnInit {

  portfolioExists = false;

  loading: boolean = true;

  objectKeys = Object.keys;
  portfolio: any = null;

  curve: any = curveMonotoneX;

  mouseOvered = {};

  @Input() ptf;
  @Input() model;
  @Input() date;
  @Input() lookback;
  @Input() asOfDate;

  cssClasses = {
    sortAscending: '',
    sortDescending: ''
  }

  targets = [
    0, 0.0001, 0.0002, 0.0003, 0.0004, 0.0005, 0.0006, 0.0007, 0.0008, 0.0009, 0.001, 0.0011, 0.0012, 0.0013, 0.0014, 0.0015,
    0.0016, 0.0017, 0.0018, 0.0019, 0.002, 0.0021, 0.0022, 0.0023, 0.0024, 0.0025, 0.003, 0.004, 0.005, 0.006, 0.007, 0.008, 0.009, 0.01
  ];
  efficientFrontier: any = [
    { name: "Efficient frontier", series: [] }
  ];
  solutions: any = []

  constructor(public api: XamApiService) { }

  ngOnInit() {}

  ngOnChanges() {
    this.api.getPortfolio().subscribe(data=> {
      this.loading = false;
      if (_.isObject(data)) {
        this.portfolioExists = true;
        this.api.data = data;
        this.portfolio = this.api.data;
        this.portfolio.scenarios = [];
        this.portfolio.efficientFrontier = [{
          name: "Efficient Frontier",
          series: []
        }, {
          name: "Portfolio",
          series: []
        }];
        _.map(this.portfolio.positions, p => p.scenarios = []);

        _.chain(this.targets)
          .map(r => this.api.optimize(this.portfolio, r).subscribe(data => {

            if (data.message.length==0) {
              if (r==0) this.portfolio.efficientFrontier[1].series = [
                { name: data.stdDev, value: this.portfolio.expectedReturn },
                { name: this.portfolio.stdDev, value: this.portfolio.expectedReturn },
                { name: this.portfolio.stdDev, value: data.expectedReturn }
              ];
              this.portfolio.efficientFrontier[0].series.push({name: data.stdDev, value: data.expectedReturn});
              //this.efficientFrontier = _.clone(this.portfolio.efficientFrontier);
              this.portfolio.scenarios.push(data);
              _.chain(data.weights)/*.rest()*/.map((weight,i) => {
                this.portfolio.positions[i].scenarios.push(weight*this.portfolio.mtm/this.portfolio.positions[i].price);
              }).value()
            }
          }))
          .value()
        console.log(this.portfolio)
      } else {
        console.warn("No data was returned for", this.ptf, this.model, this.date);
      }
    });
  }

  createTrades(scenario) {
    console.log("Creating trade orders for scenario", scenario.trades);
    _.chain(scenario.trades)
      .map(t => this.api.insertTrade(t).subscribe(data=>console.log(data)))
      .value()
    /*_.chain(this.portfolio.positions)
      .map(p => {
        if (p.suggestedQuantity != p.quantity) {
          this.api.insertTrade(p.asset, p.suggestedQuantity - p.quantity, p.price).subscribe(data => console.log(data))
        }
      })
      .value()*/
  }

  decimalDigits(n) {
    var i = 3-Math.floor(Math.log(n));
    return '1.'+i+'-'+i;
  }

  split(s) {
    return s.split(/(?=[A-Z])/).join(' ')
  }

  theRowClass() {
    return 'bg-indigo-500 white'
  }

}
