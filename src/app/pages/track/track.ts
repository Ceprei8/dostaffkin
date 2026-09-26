import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Header } from '../../header/header';
import { DeliveryApi } from '../../services/delivery-api';

@Component({
  selector: 'app-track',
  imports: [Header, FormsModule],
  templateUrl: './track.html',
  styleUrl: './track.css'
})
export class Track {
  trackNumber = '';
  trackResult: any = signal(null);

  constructor(private deliveryApi: DeliveryApi) {}

  trackShipment(): void {
    const rawValue = this.trackNumber.trim();

    if (!rawValue) {
      alert('Заполните номер отправления');
      return;
    }

    this.trackResult.set(null);
    const numericValue = Number(rawValue);
    if (Number.isNaN(numericValue) || numericValue <= 0) {
      alert('Введите корректный номер отправления');
      return;
    }

    this.deliveryApi.getDeliveryInfo(numericValue).subscribe((response) => {
      if ('error' in response) {
        alert(response.error);
        return;
      }

      this.trackResult.set(response);
    });
  }
}