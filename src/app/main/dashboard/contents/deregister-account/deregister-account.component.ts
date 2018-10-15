import { Component, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { UserManagementService } from 'src/app/services/httpRequest/user-management.service';
import { Router } from '@angular/router';
import { StorageService } from '../../../../services/storage.service';
import { MatDialog } from '@angular/material';
import { UserDeregistrationConfirmDialog } from 'src/app/dialogs/user-deregistration-confirm-dialog/user-deregistration-confirm-dialog';

@Component({
  selector: 'app-deregister-account',
  templateUrl: './deregister-account.component.html',
  styleUrls: ['./deregister-account.component.css']
})
export class DeregisterAccountComponent implements OnInit {
  currentPassword: FormControl;
  hide: boolean;
  errorhide: boolean;

  //-----(Dialog variables)--------
  isCanceled: boolean;
  //-------------------------------

  constructor(
    private umService: UserManagementService,
    private storageService: StorageService,
    private dialog: MatDialog
  ) {
    this.currentPassword = new FormControl('', Validators.required);
  }

  ngOnInit() {
    this.hide = true;
    this.errorhide = true;
    this.currentPassword.setValue(null);
  }

  getCurrentPasswordErrorMessage() {
    return 'The field is required';
  }

  /**
   *  Dialog function 
   */
  openConfirmDialog(): void {
    const dialogRef = this.dialog.open(UserDeregistrationConfirmDialog, {
      width: 'auto', height: 'auto',
      data: { isCanceled: this.isCanceled }
    });

    dialogRef.afterClosed().subscribe(result => {

      if (result != null && !result.isCanceled) {

        var payload = {
          nsc: this.storageService.get('userInfo').nsc,
          tlv: {
            password: this.currentPassword.value
          }
        }
  
        var success: boolean = this.umService.UDR(payload);
  
        if (!success) {
          alert('Failed!');
        }
      }
    });
  }

  onSubmit() {
    this.errorhide = false;

    if (!this.currentPassword.invalid) {

      this.openConfirmDialog();
    }
  }

}