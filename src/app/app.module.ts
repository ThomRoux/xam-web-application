import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// ANGULAR MATERIAL DESIGN
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatSortModule } from '@angular/material';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
//import { MatSelectModule } from '@angular/material/select';
//import { MatNativeDateModule } from '@angular/material';
//import { MatDatepickerModule } from '@angular/material/datepicker';
//import { MatInputModule } from '@angular/material/input';

// PRIMENG MODULES
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';


import { TrendModule } from 'ngx-trend';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { NgxChartsModule } from '@swimlane/ngx-charts';


import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { MarketOverviewComponent } from './market-overview/market-overview.component';
import { XamApiService } from './xam-api.service';
import { ModelOverviewComponent } from './model-overview/model-overview.component';
import { PortfolioOverviewComponent } from './portfolio-overview/portfolio-overview.component';

const appRoutes: Routes = [
  { path: 'market-overview', component: MarketOverviewComponent },
  { path: 'model-overview', component: ModelOverviewComponent },
  { path: 'portfolio-overview', component: PortfolioOverviewComponent }
];


@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    SidebarComponent,
    MarketOverviewComponent,
    ModelOverviewComponent,
    PortfolioOverviewComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    ),
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatGridListModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatStepperModule,
    MatButtonModule,
    //MatSelectModule,
    //MatDatepickerModule, MatNativeDateModule,
    //MatInputModule,
    CalendarModule,
    DropdownModule,
    TableModule,
    
    TrendModule,
    NgxDatatableModule,
    NgxChartsModule
  ],
  providers: [XamApiService],
  bootstrap: [AppComponent]
})
export class AppModule { }
