import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { of } from 'rxjs/observable/of';
import * as moment from 'moment';

import * as qp from 'quadprog';
import * as math from 'mathjs';
import * as _ from 'underscore';

import { ptfData } from './ptfData';

@Injectable()
export class XamApiService {

  dateFormat = 'YYYY-MM-DD[T]HH:mm';
  model = 'hourly';
  date = moment.utc().minute(0).second(0).millisecond(0).format('YYYY-MM-DD HH:mm');
  asOfDate: any = null;
  //date = new Date();
  //date = "2018-03-28T11:03";
  portfolio = 'MyPTF1';
  lookback = 'P3M';

  data: any = {};

  host = "http://192.168.1.8";
  port = "3000";

  constructor(private http: HttpClient) { }

  getMarketData(id: String, period='P1D') {
    var d = moment.duration(period);
    return this.http.get(`${this.host}:${this.port}/marketdata/new/${id}/${this.date}/${moment.utc(this.date).subtract(d).format(this.dateFormat)}`)
    .pipe(
      tap(data => console.log(`fetched marketdata`)),
      catchError(this.handleError('getMarketData', []))
    );
  }

  getReturns(period) {
    var d = moment.duration(period||'P1D');
    return this.http.get(`${this.host}:${this.port}/models/${this.model}/returns/${this.date}/${moment.utc(this.date).subtract(d).format(this.dateFormat)}`)
    .pipe(
      tap(data => console.log(`fetched returns data`)),
      catchError(this.handleError('getReturns', []))
    );
  }

  getPortflioList() {
    var url = `${this.host}:${this.port}/portfolios/`;
    return this.http.get(url)
    .pipe(
      tap(data => console.log(`Fecthed Portfolio List`)),
      catchError(this.handleError('getPortfolioList', []))
    );
  }

  getPortfolio() {
    var d = moment.utc(this.date); //d.subtract('P2H');
    var aod = moment.utc(this.asOfDate||this.date);
    console.log(this.date);
    //d.set({'minute': 0, 'second': 0, 'millisecond': 0})
    //var dd = moment.utc(this.date).subtract(moment.duration(this.lookup));
    //console.log(this.date,d,dd)
    var url = `${this.host}:${this.port}/portfolios/${this.portfolio}/${this.model}/${aod.toISOString()}/${d.toISOString()}/${this.lookback}`;
    console.log("GET", url);
    return this.http.get(url)
    .pipe(
      tap(data => {
        console.log(data);
        // We compute different stats when we receive the portfolio object
        var Beta = _.chain(data['positions']).map(i => _.map(data['factors'].names, f => i.exposures[f]||0)).value();
        var Sigma = data['factors'].covariance;
        var TheMatrix = math.multiply(math.multiply(Beta,Sigma),math.transpose(Beta));
        var Means = _.values(data['factors'].means);
        var wStar = _.map(data['positions'], p => p.price*p.quantity/data['mtm']);
        data['intercept'] = true;
        data['variance'] = math.multiply(math.multiply(wStar, TheMatrix), wStar);
        data['stdDev'] = math.sqrt(data['variance']);
        data['expectedReturn'] = math.multiply(wStar, math.multiply(Beta, _.values(data['factors'].means)))
        console.log(`fetched portfolio data`)
      }),
      catchError(this.handleError('getPortfolio', ptfData))
    );
  }

  insertTrade(scenario: Object) {
    var d = moment.utc(this.date).toDate();
    return this.http.post(`${this.host}:${this.port}/portfolios/trade`, scenario)
    .pipe(
      tap(data => console.log(`Posted trade data`)),
      catchError(this.handleError('insertTrade', []))
    );
  }

  optimizeWithFees(ptfData, fees = 0.0025) {
    var assets = _.pluck(ptfData.positions, 'asset');
    var prices = _.pluck(ptfData.positions, 'price');
    var quantities = _.pluck(ptfData.positions, 'quantity');

    var Beta = _.chain(ptfData.positions).map(i => _.map(ptfData.factors.names, f => i.exposures[f]||0)).value();
    Beta = [...Beta, ...Beta];
    var Sigma = _.map(ptfData.factors.covariance, row => [...row, ...row]);
    Sigma = [...Sigma, ...Sigma];

    var constraintsMatrix = [];
    var constraintsTargets = [0];
    constraintsMatrix.push([...math.multiply(1+fees, prices), ...math.multiply(fees-1, prices)]);
  }

  optimize(ptfData, target = 0.0015) {
    // We're willing to solve Min[ w S w ] with constraints A w >= b

    var wStar = _.map(ptfData.positions, p => 0);

    // S = Beta Sigma Beta
    var Beta = _.chain(ptfData.positions).map(i => _.map(ptfData.factors.names, f => i.exposures[f]||0)).value();
    var Sigma = ptfData.factors.covariance;
    var TheMatrix = math.multiply(math.multiply(Beta,Sigma),math.transpose(Beta));
    var DVec = _.map(ptfData.positions, p=>0);

    // Only 1 constraint for now : Expected return positive
    var Constraints = [
      math.ones(ptfData.positions.length)._data,  // Sum(w) = 1
      ...math.eye(ptfData.positions.length)._data, // w > 0 for any w
      math.multiply(Beta, _.values(ptfData.factors.means)) // E[dP] = w β E[F]
    ];
    var Targets = [
      1,
      ..._.map(ptfData.positions, p => p.asset=='bitcoin'?0:0),//,wStar,
      target //- math.multiply(wStar, math.multiply(Beta, _.values(ptfData.factors.means)))
    ];
    // Each of these objects need to be "prepended" will null value, so as to "shift" their indices by 1
    var DVec2 = [null, ...DVec];
    var Targets2 = [null, ...Targets];
    var TheMatrix2 = [
      null,
      ..._.map(TheMatrix, i => [null, ...i])
    ];
    var Constraints2 = [
      null,
      ..._.map(math.transpose(Constraints), i => [null, ...i])
    ];

    /*console.log({
      zeros: Zeros,
      matrix: TheMatrix,
      constraints: Constraints,
      targets: Targets
    });*/

    var res = qp.solveQP(TheMatrix2, DVec2, Constraints2, Targets2, 1);
    if (res.message.length==0) {
      var weights = math.add(wStar,_.rest(res.solution));
      res.variance = math.multiply(math.multiply(weights, TheMatrix), weights);
      res.stdDev = math.sqrt(res.variance);
      res.expectedReturn = math.multiply(weights, math.multiply(Beta, _.values(ptfData.factors.means)));
      res.target = target;
      res.weights = weights;
      res.wStar = wStar;
      res.means = math.multiply(Beta, _.values(ptfData.factors.means));
      res.trades = _.chain(weights)
        .map((w, i) => {
          var deltaQ = w*ptfData.mtm/ptfData.positions[i].price-ptfData.positions[i].quantity;
          return {
            portfolio: ptfData._id,
            timestamp: moment.utc().toDate(),
            asset: ptfData.positions[i].asset,
            quantity: deltaQ,
            price: ptfData.positions[i].price*(1+(deltaQ<0?-0.0026:0.0026))
          }
        })
        .filter(t => t.quantity!=0)
        .value()
    }
    // console.log(res);
    return of(res);
  }

  optimizeDelta(ptfData, target = 0.0015) {
    // We're willing to solve Min[ (w+w*) S (w+w*) ] with constraints A w >= b
    // (w+w*) S (w+w*) = w S w + w* S w + w S w* + w* s w* = w S w + 2 w S w* + w* S w*
    // Minimizing the above is the same as minimizing (w S w* + 1/2 w S w)
    // Every index of Vector or Matrix will start from 1, and not 0

    var wStar = _.map(ptfData.positions, p => p.price*p.quantity/ptfData.mtm);

    // S = Beta Sigma Beta
    var Beta = _.chain(ptfData.positions).map(i => _.map(ptfData.factors.names, f => i.exposures[f]||0)).value();
    var Sigma = ptfData.factors.covariance;
    var TheMatrix = math.multiply(math.multiply(Beta,Sigma),math.transpose(Beta));
    var DVec = math.multiply(TheMatrix, wStar);

    // Only 1 constraint for now : Expected return positive
    var Constraints = [
      math.ones(ptfData.positions.length)._data,  // Sum(w) = 0
      ...math.eye(ptfData.positions.length)._data, // w > -w* for any w
      math.multiply(Beta, _.values(ptfData.factors.means)) // E[dP] = w β E[F]
    ];
    var Targets = [
      0,
      ..._.map(wStar, i => -i),
      target //- math.multiply(wStar, math.multiply(Beta, _.values(ptfData.factors.means)))
    ];
    // Each of these objects need to be "prepended" will null value, so as to "shift" their indices by 1
    var DVec2 = [null, ...DVec];
    var Targets2 = [null, ...Targets];
    var TheMatrix2 = [
      null,
      ..._.map(TheMatrix, i => [null, ...i])
    ];
    var Constraints2 = [
      null,
      ..._.map(math.transpose(Constraints), i => [null, ...i])
    ];

    /*console.log({
      zeros: Zeros,
      matrix: TheMatrix,
      constraints: Constraints,
      targets: Targets
    });*/

    var res = qp.solveQP(TheMatrix2, DVec2, Constraints2, Targets2, 1);
    if (res.message.length==0) {
      var weights = math.add(wStar,_.rest(res.solution));
      res.variance = math.multiply(math.multiply(weights, TheMatrix), weights);
      res.stdDev = math.sqrt(res.variance);
      res.expectedReturn = math.multiply(weights, math.multiply(Beta, _.values(ptfData.factors.means)));
      res.target = target;
      res.weights = weights;
      res.wStar = wStar;
    }
    // console.log(res);
    return of(res);
  }

  /**
 * Handle Http operation that failed.
 * Let the app continue.
 * @param operation - name of the operation that failed
 * @param result - optional value to return as the observable result
 */
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // Let the app keep running by returning an empty result.

      var data = result;
      var Beta = _.chain(data['positions']).map(i => _.map(data['factors'].names, f => i.exposures[f]||0)).value();
      var Sigma = data['factors'].covariance;
      var TheMatrix = math.multiply(math.multiply(Beta,Sigma),math.transpose(Beta));
      var Means = _.values(data['factors'].means);
      var wStar = _.map(data['positions'], (p,i) => p.price*p.quantity/data['mtm']);
      data['intercept'] = true;
      data['variance'] = math.multiply(math.multiply(wStar, TheMatrix), wStar);
      data['stdDev'] = math.sqrt(data['variance']);
      data['expectedReturn'] = math.multiply(wStar, math.multiply(Beta, _.values(data['factors'].means)));
      data['optimizerObjects'] = {beta: Beta, sigma: Sigma, matrix: TheMatrix, wStar: wStar, means: Means};
      return of(data as T);
    };
  }

}
