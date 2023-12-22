// @ts-ignore
import { Component, OnInit } from '@angular/core';
import { IndeedService } from '../indeed.service';

@Component({
  selector: 'app-notarize-data',
  templateUrl: './notarize-data.component.html',
  styleUrls: ['./notarize-data.component.css']
})
export class NotarizeDataComponent implements OnInit {

  file: File | null = null;
  text: string | null = null;

  message: string | null = null;
  errormessage: string | null=null;
  json_data: any = null;
  proof: any = null;

  constructor(private indeedService: IndeedService) {
    // @ts-ignore
    document.getElementById("VerifyDataNavItem").classList.remove("selected");
    // @ts-ignore
    document.getElementById("NotarizeDataNavItem").classList.add("selected");
  }

  ngOnInit(): void {
  }

 onSubmit (): void {
  this.proof = null;

  this.errormessage = "";
  this.message = "";

  if(this.text != null)
   {
     this.message = "Notarizing data ..."
     try {

       this.json_data = this.toJSONArray(this.text);

     }catch(e) {
       this.message = "";
        this.errormessage = "The data could not be parsed. Please use the JSON format!";
       return;
     }

     if(this.json_data == null){
       this.errormessage = "The provided data doesn't have the expected format!";
       return;
     }
     this.notarizeJSONArray();
     this.text = null;

     (<HTMLElement> document.getElementById("notarizeInput")).innerHTML = "";

     if(this.file){
       this.file = null;
       (<HTMLInputElement> document.getElementById('fileInput')).value = '';
     }
   }else{
      this.errormessage = "Please provide data!";
   }
}


  /*
   * tries to convert the provided string into a
   * JSON Array
  */
  toJSONArray(_data:string): string | null{
    if(_data.charAt(0) == '[') {
      console.log("JSON Array");
      return JSON.parse(_data);
    }
    else if(_data.length != 0 && _data.charAt(0) != '[' && _data.charAt(_data.length-1) != ']') {
      console.log("Single Datapoint");
      return  JSON.parse('[' + _data + ']');
    }
    return null;

  }

  /*
   * notarizes this.json_data
   */
  notarizeJSONArray(){
    this.indeedService.notarizeData(this.json_data).subscribe(proof  => {
      this.proof = proof;
      console.log(proof);
      this.message = `Successfully uploaded the file. It was saved in our database. ` +
        '<br/> Please download your notarization proof for later data verification';
    });
  }


  onFileClick() {
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
        const _file = this.toJSONArray(data);

        if(_file == null){
          this.errormessage = "The provided JSON doesn't have the expected format!";
          return;
        }

        this.text = JSON.stringify(_file, null, 2);

        (<HTMLElement> document.getElementById("notarizeInput")).innerHTML = this.text;
      }catch (e) {

        this.message = "";
        this.errormessage = "The data could not be parsed. Please use the JSON format!";
      }


    };

    reader.readAsText(this.file);
  }

  formatJSON(json: string) {
    return JSON.stringify(json, null, 4);
  }

  downloadProof(json: string){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(json));
    var dlAnchorElem = document.getElementById('downloadAnchorElem');
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "NotarizationProof_"+ Date.now() + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }
}
