import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout, retry } from 'rxjs/operators';
import { StorageService } from 'src/app/services/storage.service';
import { MsgService } from '../msg.service';
import { HEADER } from 'src/app/header';
import { DisplayMessageService } from '../display-message.service';

@Injectable({
  providedIn: 'root'
})
export class DataMonitoringService {

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private msgService: MsgService,
    private dispMsgService: DisplayMessageService) { }

  /**
   * Latlng to address
   */
  latlngToAddress(lat: number, lng: number, cb) {
    this.http.get(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${HEADER.GOOGLE_MAP_API_KEY}`)
      .subscribe((result) => {
        //console.log('latlngToAddress function: ', result);
        cb(result);
      });
  }


  /** RAV */
  fnRav(payload: any, cb) {
    var usn;
    if (this.storageService.get('userInfo') != null) {
      usn = Number(this.storageService.fnGetUserSequenceNumber())
    }
    else usn = 0x000000;

    var reqMsg: any = this.msgService.fnPackingMsg(payload, HEADER.MSGTYPE.RAV_REQ, usn);
    //console.log("HTTP:RAV-REQ => ", reqMsg);

    this.http.post(`/serverapi`, reqMsg)
        
    .pipe(timeout(HEADER.TIMER.T416),
    retry(HEADER.RETRIVE.R416))

      .subscribe((rspMsg: any) => {
        //console.log("HTTP:RAV-RSP => ", rspMsg);
        cb(rspMsg);
        if (!this.msgService.fnVerifyMsgHeader(rspMsg, HEADER.MSGTYPE.RAV_RSP, reqMsg.header.endpointId)) {
          cb(null); return;
        }

        else {
          switch (rspMsg.payload.resultCode) {
            // OK: 0, OTHER: 1, UNALLOCATED_USER_SEQUENCE_NUMBER: 2, INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS: 3,

            case (HEADER.RESCODE_SWP_RAV.OK):  // success
              cb(rspMsg); break;

            case (HEADER.RESCODE_SWP_RAV.OTHER): // reject-other
              this.dispMsgService.fnDispErrorString('OTHER');
              cb(null); break;

            case (HEADER.RESCODE_SWP_RAV.UNALLOCATED_USER_SEQUENCE_NUMBER):  // reject-unallocated user sequence number
              this.dispMsgService.fnDispErrorString('UNALLOCATED_USER_SEQUENCE_NUMBER');
              cb(null); break;

            case (HEADER.RESCODE_SWP_RAV.INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS): // reject-incorrect number of signed-in completions
              this.dispMsgService.fnDispErrorString('INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS');
              cb(null); break;
          }
        }
      }, (err) => {
        if (err.timeout) {
          console.log('In timeout error which is -> ', err);
        }
        else {
          console.log('Error which is -> ', err);
        }
      });
  }

  /** RHV */
  fnRhv(payload: any, cb) {
    var reqMsg: any = this.msgService.fnPackingMsg(payload, HEADER.MSGTYPE.RHV_REQ, Number(this.storageService.fnGetUserSequenceNumber()));
    console.log('RHV-REQ => ', reqMsg);

    this.http.post(`/serverapi`, reqMsg)
            
    .pipe(timeout(HEADER.TIMER.T417),
    retry(HEADER.RETRIVE.R417))

      .subscribe((rspMsg: any) => {
        console.log('RHV-RSP => ', rspMsg);
        cb(rspMsg);
        if (!this.msgService.fnVerifyMsgHeader(rspMsg, HEADER.MSGTYPE.RHV_RSP, reqMsg.header.endpointId)) {
          cb(null); return;
        }

        else {
          switch (rspMsg.payload.resultCode) {
            // OK: 0, OTHER: 1, UNALLOCATED_USER_SEQUENCE_NUMBER: 2, INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS: 3,

            case (HEADER.RESCODE_SWP_RHV.OK):  // success
              cb(rspMsg); break;

            case (HEADER.RESCODE_SWP_RHV.OTHER): // reject-other
              this.dispMsgService.fnDispErrorString('OTHER');
              cb(null); break;

            case (HEADER.RESCODE_SWP_RHV.UNALLOCATED_USER_SEQUENCE_NUMBER):  // reject-unallocated user sequence number
              this.dispMsgService.fnDispErrorString('UNALLOCATED_USER_SEQUENCE_NUMBER');
              cb(null); break;

            case (HEADER.RESCODE_SWP_RHV.INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS): // reject-incorrect number of signed-in completions
              this.dispMsgService.fnDispErrorString('INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS');
              cb(null); break;
          }
        }
      }, (err) => {
        if (err.timeout) {
          console.log('In timeout error which is -> ', err);
        }
        else {
          console.log('Error which is -> ', err);
        }
      });
  }

  /** HAV */
  fnHav(payload: any, cb) {
    var reqMsg: any = this.msgService.fnPackingMsg(payload, HEADER.MSGTYPE.HAV_REQ, Number(this.storageService.fnGetUserSequenceNumber()));
    //console.log("HAV-REQ => ", reqMsg);

    this.http.post(`/serverapi`, reqMsg)
                
    .pipe(timeout(HEADER.TIMER.T418),
    retry(HEADER.RETRIVE.R418))

      .subscribe((rspMsg: any) => {
        //console.log("HAV-RSP => ", rspMsg);

        cb(rspMsg);
        if (!this.msgService.fnVerifyMsgHeader(rspMsg, HEADER.MSGTYPE.HAV_RSP, reqMsg.header.endpointId)) {
          cb(null); return;
        }

        else {
          switch (rspMsg.payload.resultCode) {
            // OK: 0, OTHER: 1, UNALLOCATED_USER_SEQUENCE_NUMBER: 2, INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS: 3, UNAUTHORIZED_USER_SEQUENCE_NUMBER: 4, NOT_EXIST_SENSORS: 5,

            case (HEADER.RESCODE_SWP_HAV.OK):  // success
              cb(rspMsg); break;

            case (HEADER.RESCODE_SWP_HAV.OTHER): // reject-other
              this.dispMsgService.fnDispErrorString('OTHER');
              cb(null); break;

            case (HEADER.RESCODE_SWP_HAV.UNALLOCATED_USER_SEQUENCE_NUMBER):  // reject-unallocated user sequence number
              this.dispMsgService.fnDispErrorString('UNALLOCATED_USER_SEQUENCE_NUMBER');
              cb(null);  break;

            case (HEADER.RESCODE_SWP_HAV.INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS): // reject-incorrect number of signed-in completions
              this.dispMsgService.fnDispErrorString('INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS');
              cb(null); break;

            case (HEADER.RESCODE_SWP_HAV.UNAUTHORIZED_USER_SEQUENCE_NUMBER): // reject-requested by an unauthorized user sequence number
              this.dispMsgService.fnDispErrorString('UNAUTHORIZED_USER_SEQUENCE_NUMBER');
              cb(null);
              break;

            case (HEADER.RESCODE_SWP_HAV.NOT_EXIST_SENSORS): // reject-not exist a sensor under the spatial-temporal search condition included in the SDP: HAV-REQ message
              this.dispMsgService.fnDispErrorString('NOT_EXIST_SENSORS');
              cb(null);
              break;
          }
        }
      }, (err) => {
        if (err.timeout) {
          console.log('In timeout error which is -> ', err);
        }
        else {
          console.log('Error which is -> ', err);
        }
      });
  }

  /** SHR */
  fnShr(payload: any, cb) {

    var reqMsg: any;

    if (this.storageService.get('userInfo') != null) {
      reqMsg = this.msgService.fnPackingMsg(payload, HEADER.MSGTYPE.SHR_REQ, Number(this.storageService.fnGetUserSequenceNumber()));
    }
    else {
      reqMsg = this.msgService.fnPackingMsg(payload, HEADER.MSGTYPE.SHR_REQ, 0);
    }
    //console.log('SHR-REQ => ', reqMsg);

    this.http.post(`/serverapi`, reqMsg)
                    
    .pipe(timeout(HEADER.TIMER.T419),
    retry(HEADER.RETRIVE.R419))

      .subscribe((rspMsg: any) => {
        //console.log('SHR-RSP => ', rspMsg);
        cb(rspMsg);
        if (!this.msgService.fnVerifyMsgHeader(rspMsg, HEADER.MSGTYPE.SHR_RSP, reqMsg.header.endpointId)) {
          cb(null);
        }

        else {
          switch (rspMsg.payload.resultCode) {
            // OK: 0, OTHER: 1, UNALLOCATED_USER_SEQUENCE_NUMBER: 2, INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS: 3,

            case (HEADER.RESCODE_SWP_SHR.OK):  // success
              cb(rspMsg);
              break;

            case (HEADER.RESCODE_SWP_SHR.OTHER): // reject-other
              this.dispMsgService.fnDispErrorString('OTHER');
              cb(null);
              break;

            case (HEADER.RESCODE_SWP_SHR.UNALLOCATED_USER_SEQUENCE_NUMBER):  // reject-unallocated user sequence number
              this.dispMsgService.fnDispErrorString('UNALLOCATED_USER_SEQUENCE_NUMBER');
              cb(null);
              break;

            case (HEADER.RESCODE_SWP_SHR.INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS): // reject-incorrect number of signed in completions
              this.dispMsgService.fnDispErrorString('INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS');
              cb(null);
              break;

            case (HEADER.RESCODE_SWP_SHR.UNAUTHORIZED_USER_SEQUENCE_NUMBER): // reject-unauthorized user sequece number
              this.dispMsgService.fnDispErrorString('UNALLOCATED_USER_SEQUENCE_NUMBER');
              cb(null);
              break;
          }
        }
      }, (err) => {
        if (err.timeout) {
          console.log('In timeout error which is -> ', err);
        }
        else {
          console.log('Error which is -> ', err);
        }
      });
  }

  /** HHV */
  fnHhv(payload: any, cb) {
    var reqMsg: any = this.msgService.fnPackingMsg(payload, HEADER.MSGTYPE.HHV_REQ, this.storageService.fnGetUserSequenceNumber());
    console.log('HHV-REQ => ', reqMsg);

    this.http.post(`/serverapi`, reqMsg)
                        
    .pipe(timeout(HEADER.TIMER.T420),
    retry(HEADER.RETRIVE.R420))

      .subscribe((rspMsg: any) => {
        console.log('HHV-RSP => ', rspMsg);
        cb(rspMsg);
        if (!this.msgService.fnVerifyMsgHeader(rspMsg, HEADER.MSGTYPE.HHV_RSP, reqMsg.header.endpointId)) {
          cb(null); return;
        }

        else {
          switch (rspMsg.payload.resultCode) {
            // OK: 0, OTHER: 1, UNALLOCATED_USER_SEQUENCE_NUMBER: 2, INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS: 3, UNAUTHORIZED_USER_SEQUENCE_NUMBER: 4,

            case (HEADER.RESCODE_SWP_HHV.OK):  // success
              cb(rspMsg);
              break;

            case (HEADER.RESCODE_SWP_HHV.OTHER): // reject-other
              this.dispMsgService.fnDispErrorString('OTHER');
              cb(null);
              break;

            case (HEADER.RESCODE_SWP_HHV.UNALLOCATED_USER_SEQUENCE_NUMBER):  // reject-unallocated user sequence number
              this.dispMsgService.fnDispErrorString('UNALLOCATED_USER_SEQUENCE_NUMBER');
              cb(null);
              break;

            case (HEADER.RESCODE_SWP_HHV.INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS): // reject-incorrect number of signed in completions
              this.dispMsgService.fnDispErrorString('INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS');
              cb(null);
              break;

            case (HEADER.RESCODE_SWP_HHV.UNAUTHORIZED_USER_SEQUENCE_NUMBER): // reject-unauthorized user sequece number
              this.dispMsgService.fnDispErrorString('UNAUTHORIZED_USER_SEQUENCE_NUMBER');
              cb(null);
              break;
          }
        }
      }, (err) => {
        if (err.timeout) {
          console.log('In timeout error which is -> ', err);
        }
        else {
          console.log('Error which is -> ', err);
        }
      });
  }

  /** KAS */
  fnKas(payload: any, cb) {
    var reqMsg: any = this.msgService.fnPackingMsg(payload, HEADER.MSGTYPE.KAS_REQ, this.storageService.fnGetUserSequenceNumber());
    console.log('KAS-REQ => ', reqMsg);

    this.http.post(`/serverapi`, reqMsg)
                            
    .pipe(timeout(HEADER.TIMER.T421),
    retry(HEADER.RETRIVE.R421))

      .subscribe((rspMsg: any) => {
        console.log('KAS-RSP => ', rspMsg);
        cb(rspMsg);
        if (!this.msgService.fnVerifyMsgHeader(rspMsg, HEADER.MSGTYPE.KAS_RSP, reqMsg.header.endpointId)) {
          cb(null); return;
        }

        else {

          switch (rspMsg.payload.resultCode) {
            // OK: 0, OTHER: 1, UNALLOCATED_USER_SEQUENCE_NUMBER: 2, INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS: 3,

            case (HEADER.RESCODE_SWP_KAS.OK):  // success
              cb(rspMsg);
              break;

            case (HEADER.RESCODE_SWP_KAS.OTHER): // reject-other
              this.dispMsgService.fnDispErrorString('OTHER');
              cb(null); break;

            case (HEADER.RESCODE_SWP_KAS.UNALLOCATED_USER_SEQUENCE_NUMBER):  // reject-unallocated user sequence number
              this.dispMsgService.fnDispErrorString('UNALLOCATED_USER_SEQUENCE_NUMBER');
              cb(null);  break;

            case (HEADER.RESCODE_SWP_KAS.INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS): // reject-incorrect number of signed in completions
              this.dispMsgService.fnDispErrorString('INCORRECT_NUMBER_OF_SIGNED_IN_COMPLETIONS');
              cb(null);
              break;
          }
        }
      }, (err) => {
        if (err.timeout) {
          console.log('In timeout error which is -> ', err);
        }
        else {
          console.log('Error which is -> ', err);
        }
      });
  }
}
