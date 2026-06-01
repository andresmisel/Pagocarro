
export interface Pago {
    id: string;
    fecha: string; // ISO date string
    monto: number;
    diasCubiertos: number;
    tipoPago: 'Nequi' | 'Efectivo';
    comprobanteUrl?: string; // Base64 data URL
    referencia?: string; // Nequi transaction reference
}

export interface ConfiguracionCiclos {
    inicio_fecha: string;
    meta_total: number;
}
