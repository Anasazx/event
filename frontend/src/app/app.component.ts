import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmDialogComponent } from './shared/ui/confirm-dialog.component';
import { ToastHostComponent } from './shared/ui/toast-host.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHostComponent, ConfirmDialogComponent],
  template: `
    <router-outlet />
    <app-toast-host />
    <app-confirm-dialog />
  `,
})
export class AppComponent {}
