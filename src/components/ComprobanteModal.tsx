import React from 'react';

interface ComprobanteModalProps {
  url: string;
  onClose: () => void;
}

export default function ComprobanteModal({ url, onClose }: ComprobanteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
      <div className="bg-zinc-900 border border-zinc-700 p-4 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-zinc-500 uppercase">Comprobante</h3>
          <button onClick={onClose} className="text-white hover:text-emerald-400 font-bold uppercase text-xs">Cerrar</button>
        </div>
        <div className="mb-4">
          <img src={url} alt="Comprobante" className="w-full h-auto max-h-[60vh] object-contain" />
        </div>
        <a 
          href={url} 
          download="comprobante.png" 
          className="block w-full p-3 bg-emerald-600 hover:bg-emerald-500 text-black text-center font-bold uppercase text-sm transition-colors"
        >
          Descargar Comprobante
        </a>
      </div>
    </div>
  );
}
