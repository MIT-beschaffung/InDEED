// @ts-ignore
import { Component, OnInit } from '@angular/core';
import { IndeedService } from '../indeed.service';

// @ts-ignore
@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.css']
})
export class VerifyComponent implements OnInit {

  text: string | null = null;

  message: string | null = null;
  errormessage: string | null = null;

  file: File | null = null;

  proof: any = null;


  constructor(private indeedService: IndeedService) {
    // @ts-ignore
    document.getElementById("VerifyDataNavItem").classList.add("selected");
    // @ts-ignore
    document.getElementById("NotarizeDataNavItem").classList.remove("selected");
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    this.message = null;
    this.errormessage = null;

    if (this.text) {
      try {
        this.checkProof(JSON.parse(this.text))
      }catch (e){
        this.errormessage = "The provided prove does not have the expected format.";
      }
    }else{
      console.log("Error");
      this.errormessage = "Please enter the notarization proof";
      return;
    }
  }

  checkProof(toProof: JSON){
    console.log(toProof);
      this.indeedService.verify(toProof)
        .subscribe(
            (proof: any) => {

              try {
              console.log('New proof:');
              console.log(proof);
              this.message = '';
              this.errormessage = '';
              this.proof = null;

              let newproof: any = proof;

              if (newproof.statusCode && newproof.statusCode != 200) {
                this.errormessage = newproof.message;
                return;
              }
              console.log(JSON.stringify(newproof));
              if (newproof.valid) {
                this.message = `The given notarization proof is valid and was included in block number ${newproof.blockNumber}. This block was published on ${JSON.stringify(newproof.timestampReadable)}.`;
              } else {
                this.message = `The given notarization proof is invalid.`
              }
              this.proof = newproof;

            } catch (e) {
                console.log(e);
                this.errormessage = "The given notarization proof is invalid.";
          }
        });
  }

  onFileSelected(event: any): void {

    /*
     * displays the file content in the textarea as a JSON array
     */

    this.file = event.target.files[0];

    this.errormessage = "";
    this.message = "";

    if(this.file == null)
      return;

    console.log(this.file);

    if(!this.file)
      return;
    const reader = new FileReader();

    reader.onload = e => {
      const data: any = reader.result;

      try {
        const _file = JSON.parse(data);

        if(_file == null){
          this.errormessage = "The provided JSON doesn't have the expected format!";
          return;
        }

        this.text = JSON.stringify(_file, null, 2);
        (<HTMLElement> document.getElementById("verifyInput")).innerHTML = this.text;
        console.log("done");
      }catch (e) {

        this.message = "";
        this.errormessage = "The data could not be parsed. Please use the JSON format!";
      }


    };

    reader.readAsText(this.file);
  }

}
