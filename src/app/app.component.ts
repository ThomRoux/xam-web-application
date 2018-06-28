import { Component } from '@angular/core';

import { XamApiService } from './xam-api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  constructor(public api: XamApiService) { }

}
