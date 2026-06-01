
/**
 * Determina la tarifa diaria correspondiente según el número de pagos realizados.
 */
export function getQuotaForCount(paymentCount: number): number {
    if (paymentCount < 30) return 100000;
    if (paymentCount < 60) return 110000;
    if (paymentCount < 90) return 120000;
    
    return 130000;
}

export function isSunday(date: Date): boolean {
    return date.getDay() === 0;
}
