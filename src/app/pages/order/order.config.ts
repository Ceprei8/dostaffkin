export const DELIVERY_SIZES = [
    {
        value: 'xs',
        rate: 9,
        min: 149,
        description: '17×12×9 см,<br>до 0.5 кг'
    },
    {
        value: 's',
        rate: 13,
        min: 199,
        description: '23×19×10 см,<br>до 2 кг'
    },
    {
        value: 'm',
        rate: 20,
        min: 249,
        description: '33×25×15 см,<br>до 5 кг'
    },
    {
        value: 'l',
        rate: 27,
        min: 349,
        description: '31×25×38 см,<br>до 12 кг'
    },
    {
        value: 'xl',
        rate: 35,
        min: 499,
        description: '60×35×30 см,<br>до 18 кг'
    },
    {
        value: 'max',
        rate: 70,
        min: 999,
        description: '120×120×80 см,<br>до 200 кг',
        mediaClass: 'main-size-media-palleta'
    }
] as const;

export const DELIVERY_SPEEDS = [
    {value: 'regular', label: 'Обычная'},
    {value: 'fast', label: 'Приоритетная'}
] as const;