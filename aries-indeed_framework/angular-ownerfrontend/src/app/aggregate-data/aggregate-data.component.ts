import { Component, OnInit } from '@angular/core';
import { IndeedService } from '../indeed.service';

@Component({
  selector: 'app-aggregate-data',
  templateUrl: './aggregate-data.component.html',
  styleUrls: ['./aggregate-data.component.css']
})
export class AggregateDataComponent implements OnInit {

  file: File | null = null;

  message: String | null = null;
  errormessage: string | null=null;
  proof: any = null;

  constructor(private indeedService: IndeedService) { }

  ngOnInit(): void {
  }

 onSubmit (): void {
  this.proof = null;

   if(!this.file) {
     this.errormessage="No file selected";
     return;
   }
   
  console.log(this.file);
 /* this.message = "Successfully uploaded the file. It was saved in our Database"; */
 

    const reader = new FileReader();

    reader.onload = e => {
      const data: any = reader.result;

      console.log(`Data: ${data}`);

      this.indeedService.aggregateData(JSON.parse(data)).subscribe(proof => {
        this.proof = proof;
        console.log(proof);
        this.message = `Successfully uploaded the file. It was saved in our database.`
      });
    };

    reader.readAsText(this.file);

    this.message = "Uploading File...";
}


  onFileClick() {
    this.file = null;
    this.message = null;
    this.errormessage = null;
  }

  onFileSelected(event: any): void {
    this.file = event.target.files[0];
  }

  formatJSON(json: string) {
    return JSON.stringify(json, null, 4);
  }
}

