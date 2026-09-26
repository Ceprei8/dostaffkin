import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DeliveryApi {
    constructor(private http: HttpClient) {}

    createDelivery(payload: any): Observable<any> {
        return this.http
            .post<any>(`https://testologia.ru/delivery/create`, payload)
            .pipe(
                catchError((err) =>
                    of({ error: err?.error?.error ?? 'Ошибка при создании заявки' })
                )
            );
    }

    getDeliveryInfo(id: number): Observable<any> {
        return this.http
            .get<any>(`https://testologia.ru/delivery/info`, { params: { id } })
            .pipe(
                catchError((err) =>
                    of({ error: err?.error?.error ?? 'Ошибка при получении статуса' })
                )
            );
    }
}