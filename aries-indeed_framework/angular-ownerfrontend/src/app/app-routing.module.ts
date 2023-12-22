import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router'; /** import RouterModule and Routes so the application can have routing functionality */
import { DashboardComponent } from './dashboard/dashboard.component';
import { SubmitJsonComponent } from './submit-json/submit-json.component';
import { SearchByIDComponent } from './search-by-id/search-by-id.component';
import { NotarizeDataComponent } from './notarize-data/notarize-data.component';
import { VerifyComponent } from './verify/verify.component';
import { AggregateDataComponent } from './aggregate-data/aggregate-data.component';

const routes: Routes = [
  /** A typical Angular Route has two properties: path: a string that matches the URL in the browser address bar.component: the component that the router should create when navigating to this route. */
  { path: 'dashboard', component: DashboardComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  //{path: 'submitJson', component: SubmitJsonComponent},
  //{path: 'SearchByID', component: SearchByIDComponent},
  {path: 'NotarizeData', component: NotarizeDataComponent},
  {path: 'Verify', component: VerifyComponent},
  //{path: 'AggregateData', component: AggregateDataComponent}
];


@NgModule({       /** The NgModule metadata initializes the router and starts it listening for browser location changes. */
  imports: [RouterModule.forRoot(routes)],    /** adds the RouterModule to the AppRoutingModule imports array and configures it with the routes in one step by calling RouterModule.forRoot() */
  exports: [RouterModule] /** AppRoutingModule exports RouterModule so it will be available throughout the application */
})
export class AppRoutingModule { }
