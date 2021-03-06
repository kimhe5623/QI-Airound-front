import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { } from 'googlemaps';
import { DataManagementService } from '../../services/data-management.service';
import { DataMonitoringService } from '../../services/httpRequest/data-monitoring.service';
import { StorageService } from 'src/app/services/storage.service';
import { HEADER } from 'src/app/header';
import { AuthorizationService } from 'src/app/services/authorization.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { ShrToHavDialog } from 'src/app/dialogs/shr-to-hav-dialog/shr-to-hav-dialog.component';

declare var google;

@Component({
  selector: 'app-sensor-maps',
  templateUrl: './sensor-maps.component.html',
  styleUrls: ['./sensor-maps.component.css']
})
export class SensorMapsComponent implements OnInit {

  @Input() isSignedin: boolean = false;
  @ViewChild('gmap') gmapElement: any;
  map: google.maps.Map;
  autocomplete: google.maps.places.Autocomplete;

  sensorData: any = {};
  markers: any = {};
  infoWindow: google.maps.InfoWindow;

  clickedMarker: string = '';

  /**
   * Nations
   */
  nations0: any = {};
  nations1: any = {};
  nations2: any = {};
  nations3: any = {};

  /**
   * Options 
   */
  enteredNationCode: string = '';
  enteredAddress: string = '';

  /**
   * Current geometry
   */
  currentGeometry: any = { nation: '', address: '', location: {} };


  constructor(
    private dataService: DataManagementService,
    private dmService: DataMonitoringService,
    private storageService: StorageService,
    private authService: AuthorizationService,
    private router: Router,
    public dialog: MatDialog,
  ) { }

  ngOnInit() {

    this.nations0 = HEADER.NATIONS[0]
    this.nations1 = HEADER.NATIONS[1];
    this.nations2 = HEADER.NATIONS[2];
    this.nations3 = HEADER.NATIONS[3];

    this.reqData((result) => {
      if(result != null) {
        this.sensorData = result.data;

        this.dataService.getCurrentAddress((currentAddress) => {
  
          this.currentGeometry.location = new google.maps.LatLng({ lat: currentAddress.currentLatlng.latitude, lng: currentAddress.currentLatlng.longitude });
  
          for (var i = 0; i < currentAddress.address.results[5].address_components.length; i++) {
            if (currentAddress.address.results[5].address_components[i].types[0] == 'country') {
              var currentNationShortname = currentAddress.address.results[5].address_components[i].short_name;
            }
          }
  
          if (this.nations3[currentNationShortname] != null) {
            this.enteredNationCode = this.nations3[currentNationShortname][1];
            this.currentGeometry.nation = this.enteredNationCode;
          }
  
          this.currentGeometry.location = currentAddress.currentLatlng;
          this.currentGeometry.address = currentAddress.address.results[0].formatted_address;
  
          /**
           * Google maps initialization
           */
          var mapProp = {
            center: new google.maps.LatLng(
              currentAddress.currentLatlng.latitude,
              currentAddress.currentLatlng.longitude
            ),
            zoom: 10,
            draggableCursor: '',
            mapTypeId: google.maps.MapTypeId.ROADMAP
          };
  
          this.map = new google.maps.Map(this.gmapElement.nativeElement, mapProp);
          this.autocomplete = new google.maps.places.Autocomplete(document.getElementById(`autocomplete`), {
            types: [`address`],
            componentRestrictions: [currentNationShortname],
          });
  
          /**
           * Event Listener for Bounds changed
           */
          google.maps.event.addListener(this.map, 'bounds_changed', () => {
            this.currentGeometry.viewport = this.map.getBounds();
            this.currentGeometry.location = this.map.getCenter();
          })
  
          /**
           * Event Listener for Autocomplete
           */
          google.maps.event.addListener(this.autocomplete, 'place_changed', () => {
  
            var place = this.autocomplete.getPlace();
  
            if (!place || !place.geometry) {
              alert("No details available for input: '" + place.name + "'");
              return;
            }
            this.currentGeometry.nation = this.enteredNationCode;
            this.currentGeometry.address = place.formatted_address;
  
            if (place.geometry.viewport) {
              this.currentGeometry.viewport = place.geometry.viewport;
              this.currentGeometry.location = place.geometry.location;
              this.map.fitBounds(place.geometry.viewport);
            }
            else {
  
              if (this.currentGeometry.viewport) {
                delete this.currentGeometry.viewport;
              }
              this.currentGeometry.location = place.geometry.location;
              this.map.setCenter(place.geometry.location);
              this.map.setZoom(13);
            }
          });
  
          /**
           * Marker & Info window
           */
          this.infoWindow = new google.maps.InfoWindow();
          this.addNewMarkers();
        });
      }
    });
  }

  // Function definition //

  /**
   * HTTP: requset data
   */
  reqData(cb) {
    var payload = {
      nsc: 0x00,
      nat: "Q30",
      state: "Q99",
      city: "Q16552"
    }
    if (this.isSignedin) {
      payload.nsc = this.storageService.fnGetNumberOfSignedInCompletions();
    }

    this.dmService.fnShr(payload, (result) => {
      if (result != null) {

        var tlvData = this.dataService.rspHistoricalSensorRecordDataParsing(result.payload.historyRecordList);
        var parsedData = { firstKey: '', data: {} };

        parsedData['firstKey'] = tlvData[0].mac;
        for (var i = 0; i < tlvData.length; i++) {
          parsedData['data'][tlvData[i].mac] = tlvData[i];
        }

        cb(parsedData);
      }
      else { cb(null); }
    })
  }

  addNewMarkers() {

    for (var key in this.sensorData) {

      var marker = new google.maps.Marker({
        map: this.map,
        position: { lat: this.sensorData[key].latitude, lng: this.sensorData[key].longitude },

        icon: {
          anchor: new google.maps.Point(40, 40),
          labelOrigin: new google.maps.Point(40, 40),
          origin: new google.maps.Point(0, 0),
          scaledSize: new google.maps.Size(80, 80),
          url: 'assets/map/marker/sensor.svg'
        },

        data: this.sensorData[key]
      });

      this.markers[key] = marker;
      this.addInfoWindow(key);
    }
  }

  /**
   * add All listener for infoWindow
   */
  addInfoWindow(key) {
    google.maps.event.clearListeners(this.markers[key], 'click');
    google.maps.event.addListener(this.markers[key], 'click', () => {

      this.getInfoWindowContents(this.markers[key]['data'], (contents) => {
        this.infoWindow.close(); // Close previously opened infowindow
        this.infoWindow.setContent(contents);
        this.infoWindow.open(this.map, this.markers[key]);
        this.clickedMarker = key;

        this.map.setCenter(new google.maps.LatLng(this.markers[this.clickedMarker].data.latitude, this.markers[this.clickedMarker].data.longitude));
        this.map.setZoom(13);
      });
    });
    google.maps.event.addListener(this.infoWindow, 'closeclick', () => {
      this.map.setZoom(10);
    });

  }


  /**
   * @param eachData : each data
   * get infoWindow contents
   */
  getInfoWindowContents(eachData: any, cb) {
    this.dmService.latlngToAddress(eachData.latitude, eachData.longitude, (address) => {

      var locationName: string;
      if (address.status == 'OK') { locationName = `<strong>${address.results[0].formatted_address}</strong>`; }
      else { locationName = `<strong>lat</strong>&nbsp; ${eachData.latitude}<br><strong>lng</strong>&nbsp; ${eachData.longitude}`; }

      var contents = `
        <style>
        table, th, td {
          border: 0.1px solid #ababab;
        }
        th, td {
          padding: 7px;
        }
        .center { 
          text-align: center;
        }
        </style>
        <h6 style="margin-bottom:5px; line-height: 30px">${locationName}</h6>
        <p>Wifi MAC address: ${this.dataService.rspToMacAddress(eachData.mac)}</p>
        <table>
          <tr>
            <th colspan="4">Measurement Start Date</th>
            <td colspan="4">${this.dataService.formattingDate(eachData.measurementStartDate)}</td>
          </tr>
          <tr>
            <th colspan="4">Measurement End Date</th>
            <td colspan="4">${this.dataService.formattingDate(eachData.measurementEndDate)}</td>
          </tr>
          <tr>
            <th colspan="4">Sensor Activation</th>
            <td colspan="4">${eachData.activation == 0 ? 'Registered' : eachData.activation == 1 ? 'Associated' : eachData.activation == 2 ? 'Operating' : eachData.activation == 3 ? 'Deregistered' : ''}</td>
          </tr>
          <tr>
          <th colspan="8" style="border-left: solid #fff; border-right: solid #fff;"></th>
          </tr>
          <tr>
            <th colspan="8">Sensor Status</th>
          </tr>
          <tr>
            <th>Temp</th>
            <th>CO</th>
            <th>O<sub>3</sub></th>
            <th>NO<sub>2</sub></th>
            <th>SO<sub>2</sub></th>
            <th>PM2.5</th>
            <th>PM10</th>
            <th>GPS</th>
          </tr>
          <tr>
            <td class="center">${eachData.status.temp ? '<i class="fa fa-circle" style="color: #03daa4" aria-hidden="true"></i>' : '<i class="fa fa-circle" style="color: #8585858c" aria-hidden="true"></i>'}</td>
            <td class="center">${eachData.status.co ? '<i class="fa fa-circle" style="color: #03daa4" aria-hidden="true"></i>' : '<i class="fa fa-circle" style="color: #8585858c" aria-hidden="true"></i>'}</td>
            <td class="center">${eachData.status.o3 ? '<i class="fa fa-circle" style="color: #03daa4" aria-hidden="true"></i>' : '<i class="fa fa-circle" style="color: #8585858c" aria-hidden="true"></i>'}</td>
            <td class="center">${eachData.status.no2 ? '<i class="fa fa-circle" style="color: #03daa4" aria-hidden="true"></i>' : '<i class="fa fa-circle" style="color: #8585858c" aria-hidden="true"></i>'}</td>
            <td class="center">${eachData.status.so2 ? '<i class="fa fa-circle" style="color: #03daa4" aria-hidden="true"></i>' : '<i class="fa fa-circle" style="color: #8585858c" aria-hidden="true"></i>'}</td>
            <td class="center">${eachData.status.pm25 ? '<i class="fa fa-circle" style="color: #03daa4" aria-hidden="true"></i>' : '<i class="fa fa-circle" style="color: #8585858c" aria-hidden="true"></i>'}</td>
            <td class="center">${eachData.status.pm10 ? '<i class="fa fa-circle" style="color: #03daa4" aria-hidden="true"></i>' : '<i class="fa fa-circle" style="color: #8585858c" aria-hidden="true"></i>'}</td>
            <td class="center">${eachData.status.gps ? '<i class="fa fa-circle" style="color: #03daa4" aria-hidden="true"></i>' : '<i class="fa fa-circle" style="color: #8585858c" aria-hidden="true"></i>'}</td>
          </tr>
        </table> `;
      cb(contents);
    });
  }

  /** Nation */
  nationChanged(value) {
    this.autocomplete.setComponentRestrictions({ 'country': [this.nations2[value][1]] });
  }

  /** SHR to HAV */
  showShrToHavDialog() {
    this.infoWindow.close();

    // Authorization check
    if (!this.authService.isUserLoggedIn()) {
      this.router.navigate([HEADER.ROUTER_PATHS.SIGN_IN]);
    }
    else {
      // If OK, Open a date input dialog
      const dialogRef = this.dialog.open(ShrToHavDialog, {
        width: 'auto', height: 'auto',
        data: { startTmsp: 0, endTmsp: 0, isCanceled: true }
      });

      // After selecting date, HAV
      dialogRef.afterClosed().subscribe(result => {
        if (result != null && !result.isCanceled) {
          this.storageService.set('shrToHav', { startTmsp: result.startTmsp, endTmsp: result.endTmsp, currentGeometry: this.currentGeometry });

          if (this.authService.isAdministor()) {
            this.router.navigate([HEADER.ROUTER_PATHS.ADMIN_AIR_HISTORY]);
          }
          else {
            this.router.navigate([HEADER.ROUTER_PATHS.COMMON_USER_AIR_HISTORY]);
          }
        }
      });


    }
  }
}

