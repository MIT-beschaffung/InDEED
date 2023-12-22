import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { FormsModule } from '@angular/forms';
import { DashboardComponent } from './dashboard/dashboard.component'; // <-- NgModel lives here

import { HttpClientModule } from '@angular/common/http';
import { SubmitJsonComponent } from './submit-json/submit-json.component';
import { SearchByIDComponent } from './search-by-id/search-by-id.component';
import { NotarizeDataComponent } from './notarize-data/notarize-data.component';
import { VerifyComponent } from './verify/verify.component';
import { AggregateDataComponent } from './aggregate-data/aggregate-data.component';
@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    //SubmitJsonComponent,
    //SearchByIDComponent,
    NotarizeDataComponent,
    VerifyComponent,
    //AggregateDataComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
