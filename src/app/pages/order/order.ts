import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UpperCasePipe } from '@angular/common';
import { Header } from '../../header/header';

import { DeliveryApi } from '../../services/delivery-api';
import { DELIVERY_SIZES, DELIVERY_SPEEDS } from './order.config';

declare var ymaps: any;

interface CalculationResult {
    from: string;
    to: string;
    size: string;
    distance: string;
    duration: number;
    rate: number;
    total: number;
    speed: string;
}

@Component({
  selector: 'app-order',
  imports: [Header, ReactiveFormsModule, UpperCasePipe],
  templateUrl: './order.html',
  styleUrl: './order.css'
})
export class Order implements OnInit, OnDestroy {
    public readonly sizes = DELIVERY_SIZES;
    public readonly speeds = DELIVERY_SPEEDS;

    public map: any;
    private mapRoute: any;

    private suggestFrom: any;
    private suggestTo: any;

    private onFromSelect = (event: any) => (this.routeForm.get('from')?.setValue(event.get('item')?.value ?? ''));
    private onToSelect = (event: any) => (this.routeForm.get('to')?.setValue(event.get('item')?.value ?? ''));

    private onRouteSuccess = () => {
        try {
            const activeRoute = this.mapRoute?.getActiveRoute();
            if (!activeRoute) {
                return this.failedCalculation();
            }

            const km = activeRoute.properties.get('distance').value / 1000;
            const sizeValue = this.routeForm.get('size')?.value ?? '';
            const sizeConfig = this.sizes.find((item) => item.value === sizeValue);
            if (!sizeConfig) {
                return this.failedCalculation();
            }
            let total = Math.max(sizeConfig.min, Math.ceil(km * sizeConfig.rate));
            let duration = Math.min(30, 1 + Math.ceil(km / 80));

            const speed = this.routeForm.get('speed')?.value;
            if (speed === 'fast') {
                total = Math.ceil(total * 1.15);
                duration = Math.ceil(duration - (duration * 0.30));
            }

            this.calculationResult.set({
                from: this.routeForm.get('from')?.value ?? '',
                to: this.routeForm.get('to')?.value ?? '',
                size: sizeValue,
                distance: km.toFixed(1),
                duration,
                rate: sizeConfig.rate,
                total,
                speed
            });
            this.isCalculating.set(false);
        } catch (err) {
            this.failedCalculation();
        }
    };

    private onRouteFail = () => {
        this.failedCalculation();
    };

    public routeForm: FormGroup;
    public orderForm: FormGroup;

    public orderId = signal<number | null>(null);
    public calculationResult = signal<CalculationResult | null>(null);
    public isCalculating = signal(false);

    constructor(private formBuilder: FormBuilder, private deliveryApi: DeliveryApi) {
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

            this.suggestFrom = new ymaps.SuggestView('from');
            this.suggestFrom.events.add('select', this.onFromSelect);

            this.suggestTo = new ymaps.SuggestView('to');
            this.suggestTo.events.add('select', this.onToSelect);
        });
    }

    ngOnDestroy() {
        if (this.suggestFrom) {
            this.suggestFrom.events.remove('select', this.onFromSelect);
            this.suggestFrom = null;
        }
        if (this.suggestTo) {
            this.suggestTo.events.remove('select', this.onToSelect);
            this.suggestTo = null;
        }
        if (this.mapRoute) {
            this.mapRoute.model.events.remove('requestsuccess', this.onRouteSuccess);
            this.mapRoute.model.events.remove('requestfail', this.onRouteFail);
            this.map.geoObjects.remove(this.mapRoute);
            this.mapRoute = null;
        }
        if (this.map) {
            this.map.destroy();
            this.map = null;
        }
    }

    public selectSize(size: string) {
        this.routeForm.get('size')?.setValue(size);
    }

    public selectSpeed(speed: string) {
        this.routeForm.get('speed')?.setValue(speed);
    }

    public calculate() {
        if (!this.map || this.routeForm.invalid) {
            return;
        }

        this.isCalculating.set(true);
        this.calculationResult.set(null);

        const {from, to} = this.routeForm.getRawValue();

        if (this.mapRoute) {
            this.map.geoObjects.remove(this.mapRoute);
            this.mapRoute = null;
        }

        this.mapRoute = new ymaps.multiRouter.MultiRoute(
            {referencePoints: [from, to]},
            {boundsAutoApply: false}
        );
        this.map.geoObjects.add(this.mapRoute);

        this.mapRoute.model.events.add('requestsuccess', this.onRouteSuccess);
        this.mapRoute.model.events.add('requestfail', this.onRouteFail);
    }

    private failedCalculation() {
        this.isCalculating.set(false);
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

        this.deliveryApi.createDelivery(payload).subscribe((response) => {
            if ('error' in response) {
                alert(response.error);
                return;
            }

            this.orderId.set(response.id);
        });
    }
}