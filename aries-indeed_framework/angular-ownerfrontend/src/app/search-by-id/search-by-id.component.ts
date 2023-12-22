import { Component, OnInit } from '@angular/core';
import { IndeedService } from '../indeed.service';

@Component({
  selector: 'app-search-by-id',
  templateUrl: './search-by-id.component.html',
  styleUrls: ['./search-by-id.component.css']
})
export class SearchByIDComponent implements OnInit {

  text: String | null = null;
  textAggregate: String | null = null;
  textNotarize: String | null = null;


  message: String | null = null;
  errormessage: string | null = null;

  proof: any = null;

  constructor(private indeedService: IndeedService) { }

  ngOnInit(): void {
  }

  onSubmit(): void {
    this.message = null;
    this.errormessage = null;

    if (!this.text) {
      this.errormessage = "Please enter an ID";
      return;
    }

    console.log(this.text);
    this.message = "Searching for '" + this.text + "'";

    this.indeedService.searchProofById(this.text)
      .subscribe(proof => {
        console.log('New proof:');
        console.log(proof);
        this.message = '';
        this.errormessage = '';
        this.proof = null;
        
        let newproof: any = proof;

        if (newproof.statusCode == 404) {
          this.errormessage = newproof.message;
          return;
        }
        
        this.message = `Here is your info for ID ${newproof._id}`;
        this.proof = newproof;
      });
  }

  onSubmitAggregate(): void {
    this.message = null;
    this.errormessage = null;

    if (!this.textAggregate) {
      this.errormessage = "Please enter an ID";
      return;
    }

    console.log(this.textAggregate);
    this.message = "Searching for '" + this.textAggregate + "'";

    this.indeedService.searchAggregatedData(this.textAggregate)
      .subscribe(proof => {
        console.log('New proof:');
        console.log(proof);
        this.message = '';
        this.errormessage = '';
        this.proof = null;
        
        let newproof: any = proof;

        if (newproof.statusCode == 404) {
          this.errormessage = newproof.message;
          return;
        }
        
        this.message = `Here is your info for ID ${newproof._id}`;
        this.proof = newproof;
      });
  }

  onSubmitNotarize(): void {
    this.message = null;
    this.errormessage = null;

    if (!this.textNotarize) {
      this.errormessage = "Please enter an ID";
      return;
    }

    console.log(this.textNotarize);
    this.message = "Searching for '" + this.textNotarize + "'";

    this.indeedService.searchNotarizedData(this.textNotarize)
      .subscribe(proof => {
        console.log('New proof:');
        console.log(proof);
        this.message = '';
        this.errormessage = '';
        this.proof = null;
        
        let newproof: any = proof;

        if (newproof.statusCode == 404) {
          this.errormessage = newproof.message;
          return;
        }
        
        this.message = `Here is your info for ID: ${newproof._id}`;
        this.proof = newproof;
      });
  }

  formatEpoch(epoch: any) {
    return new Date(epoch).toString();
  }

  formatEpochMillis(epoch: any) {
    return new Date(epoch * 1000).toString();
  }

}
