import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
import { Header } from '../../header/header';

import { DELIVERY_SIZES, DELIVERY_SPEEDS } from './order.config';

declare var ymaps: any;

@Component({
  selector: 'app-order',
  imports: [Header, ReactiveFormsModule, UpperCasePipe],
  templateUrl: './order.html',
  styleUrl: './order.css'
})
export class Order implements OnInit {
    public readonly sizes = DELIVERY_SIZES;
    public readonly speeds = DELIVERY_SPEEDS;

    public map: any;
    private mapRoute: any;

    public routeForm: FormGroup;
    public orderForm: FormGroup;

    public orderId: any = signal(null);
    public calculationResult: any = signal(null);

    constructor(private formBuilder: FormBuilder) {
        this.routeForm = this.formBuilder.group({
            from: ['', Validators.required],
            to: ['', Validators.required],
            size: ['xs', Validators.required],
            speed: ['regular', Validators.required]
        });
        this.orderForm = this.formBuilder.group({
            name: ['', Validators.required],
            phone: ['', [Validators.required]],
            comment: ['']
        });
    }

    ngOnInit() {
        ymaps.ready(() => {
            this.map = new ymaps.Map('map', {
                center: [55.751244, 37.618423],
                zoom: 5,
                controls: ['zoomControl']
            });

            // Подключаем подсказки адресов к полям от яндекса
            (new ymaps.SuggestView('from')).events.add('select', (event: any) => (this.routeForm.controls['from'].setValue(event.get('item')?.value ?? '')));
            (new ymaps.SuggestView('to')).events.add('select', (event: any) => (this.routeForm.controls['to'].setValue(event.get('item')?.value ?? '')));
        });
    }

    public selectSize(size: string) {
        this.routeForm.controls['size'].setValue(size);
    }

    public selectSpeed(speed: string) {
        this.routeForm.controls['speed'].setValue(speed);
    }

    public calculate() {
        this.calculationResult.set(null);

        if (!this.map || this.routeForm.invalid) {
            return;
        }

        const {from, to, size, speed} = this.routeForm.getRawValue();

        if (this.mapRoute) {
            this.map.geoObjects.remove(this.mapRoute);
            this.mapRoute = null;
        }

        this.mapRoute = new ymaps.multiRouter.MultiRoute(
            {referencePoints: [from, to]},
            {boundsAutoApply: false}
        );
        this.map.geoObjects.add(this.mapRoute);

        this.mapRoute.model.events.add('requestsuccess', () => {
            try {
                const activeRoute = this.mapRoute.getActiveRoute();
                if (!activeRoute) {
                    return this.failedCalculation();
                }

                const km = activeRoute.properties.get('distance').value / 1000;
                const sizeValue = size ?? '';
                const sizeConfig = this.sizes.find((item) => item.value === sizeValue);
                if (!sizeConfig) {
                    return this.failedCalculation();
                }
                let total = Math.max(sizeConfig.min, Math.ceil(km * sizeConfig.rate));
                let duration = Math.min(30, 1 + Math.ceil(km / 80));

                if (speed === 'fast') {
                    total = Math.ceil(total * 1.15);
                    duration = Math.ceil(duration - (duration * 0.30));
                }

                this.calculationResult.set({
                    from,
                    to,
                    size,
                    distance: km.toFixed(1),
                    duration,
                    rate: sizeConfig.rate,
                    total,
                    speed
                });
            } catch (err) {
                this.failedCalculation();
            }
        });

        this.mapRoute.model.events.add('requestfail', () => this.failedCalculation());
    }

    private failedCalculation() {
        this.calculationResult.set(null);
        alert('Не удалось построить маршрут. Проверьте адреса и выбранные параметры.');
    }

    public submitOrder() {
        const calculation = this.calculationResult();
        if (!calculation) {
            alert('Сначала рассчитайте стоимость, чтобы оформить заявку');
            return;
        }

        if (this.orderForm.invalid) {
            alert('Введите имя и корректный телефон');
            return;
        }

        const {name, phone, comment} = this.orderForm.getRawValue();
        const trimmedName = (name ?? '').trim();
        const trimmedPhone = (phone ?? '').trim();
        const trimmedComment = (comment ?? '').trim();

        const payload = {
            customer: {name: trimmedName, phone: trimmedPhone, comment: trimmedComment},
            calculation: calculation,
            createdAt: new Date().toISOString()
        };

        console.log(payload);
        this.orderId.set(1);
    }
}