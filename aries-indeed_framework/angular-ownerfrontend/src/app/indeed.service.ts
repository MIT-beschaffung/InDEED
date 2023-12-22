import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class IndeedService {

  private host = "";
  private header = new HttpHeaders().set('Content-Type', 'application/json').set('api_key', 'NO_FOUND');
  // private host = '';

  constructor(private http: HttpClient) {
  }

  searchProofById(id: String) {
    const url = `${this.host}/loggeddata/${id}`;
    return this.http.get(url, {
      headers: this.header,
    }).pipe(tap(_ => console.info(`searchProofById: ${id}`)), catchError(error => {
      console.error(error);
      return of(null);
    }));
  }

  searchAggregatedData(id: String) {
    const url = `${this.host}/aggregate/${id}`;
    return this.http.get(url, {
      headers: this.header,
    }).pipe(tap(_ => console.info(`searchAggregatedData: ${id}`)), catchError(error => {
      console.error(error);
      return of(null);
    }));
  }

  searchNotarizedData(id: String) {
    const url = `${this.host}/notarize/${id}`;
    return this.http.get(url, {
      headers: this.header,
    }).pipe(tap(_ => console.info(`searchNotarizedData: ${id}`)), catchError(error => {
      console.error(error);
      return of(null);
    }));
  }

  logData(data: Object) {
    const url = `${this.host}/loggeddata`;
    return this.http.post(url, data, {
      headers: this.header,
    }).pipe(tap(_ => console.info(`logData...`)), catchError(error => {
      console.error(error);
      return of(null);
    }));
  }

  aggregateData(data: Object) {
    const url = `${this.host}/aggregate/aggregateObjects`;
    return this.http.post(url, data, {
      headers: this.header,
    }).pipe(tap(_ => console.info(`aggregateData...`)), catchError(error => {
      console.error(error);
      return of(null);
    }));
  }

  notarizeData(data: Object) {
    const url = `${this.host}/notarize/notarizeObjects`;
    return this.http.post(url, data, {
      headers: this.header,
    }).pipe(tap(_ => console.info(`notarizeData...`)), catchError(error => {
      console.error(error);
      return of(null);
    }));
  }

  verify(data: Object) {
    const url = `${this.host}/notarize/verifyNotarizationProof`;
    return this.http.post(url, data, {
      headers: this.header,
    }).pipe(tap(_ => console.info(`verify...`)), catchError(error => {
      console.error(error);
      return of(null);
    }));
  }
}
