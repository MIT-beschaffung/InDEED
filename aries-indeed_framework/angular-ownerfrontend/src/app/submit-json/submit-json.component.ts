import { Component, OnInit } from '@angular/core';
import { IndeedService } from '../indeed.service';

@Component({
  selector: 'app-submit-json',
  templateUrl: './submit-json.component.html',
  styleUrls: ['./submit-json.component.css']
})
export class SubmitJsonComponent implements OnInit {

  file: File | null = null;

  message: String | null = null;
  errormessage: string | null = null;

  id: any = null;

  constructor(private indeedService: IndeedService) { }

  ngOnInit(): void {
  }

  onSubmit(): void {
    this.id = null;

    if (!this.file) {
      this.errormessage = "No file selected";
      return;
    }

    console.log(this.file);

    const reader = new FileReader();

    reader.onload = e => {
      const data: any = reader.result;

      console.log(`Data: ${data}`);

      this.indeedService.logData(JSON.parse(data)).subscribe(id => {
        this.id = id;
        console.log(`New ID: ${this.id._id}`);
        console.log(id);
        this.message = `Successfully uploaded the file. Here is your ID: ${this.id._id}`;
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

  formatEpoch(epoch: any) {
    return new Date(epoch).toString();
  }
}
