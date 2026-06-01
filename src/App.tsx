import { useState, useEffect } from 'react';
import { getQuotaForCount, isSunday } from './lib/paymentCalculator';
import { registrarPago, obtenerPagos, updatePago, deletePago } from './services/paymentService';
import { Pago } from './types';
import ComprobanteModal from './components/ComprobanteModal';

export default function App() {
  const [quota, setQuota] = useState(0);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [editingPago, setEditingPago] = useState<Pago | null>(null);
  const [selectedComprobanteUrl, setSelectedComprobanteUrl] = useState<string | null>(null);
  const [form, setForm] = useState({ fecha: new Date().toISOString().split('T')[0], tipoPago: 'Nequi' as 'Nequi' | 'Efectivo', monto: 0, referencia: '' });

  useEffect(() => {
    obtenerPagos().then(data => {
        setPagos(data.sort((a,b)=> b.fecha.localeCompare(a.fecha)));
        setLoading(false);
    });
  }, []);

  useEffect(() => {
    setQuota(isSunday(new Date()) ? 0 : getQuotaForCount(pagos.length));
    setForm(f => ({...f, monto: isSunday(new Date()) ? 0 : getQuotaForCount(pagos.length)}));
  }, [pagos]);

  const totalPagado = pagos.reduce((acc, p) => acc + p.monto, 0);
  const meta = 50000000;
  const progreso = (totalPagado / meta) * 100;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if(password === 'admin321') setIsAdmin(true);
  };
  const handleLogout = () => { setIsAdmin(false); setPassword(''); };

  const handleRegistrarPago = async (e: React.FormEvent) => {
    e.preventDefault();
    let comprobanteUrl = undefined;
    
    if (file) {
        const reader = new FileReader();
        comprobanteUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    }

    const pagoData: any = {...form, fecha: form.fecha, diasCubiertos: 1};
    if (comprobanteUrl) {
        pagoData.comprobanteUrl = comprobanteUrl;
    }
    if (form.tipoPago === 'Nequi' && form.referencia) {
        pagoData.referencia = form.referencia;
    }

    const newId = await registrarPago(pagoData);
    setPagos(prev => [{...pagoData, id: newId}, ...prev].sort((a,b)=> b.fecha.localeCompare(a.fecha)));
    setForm({ fecha: new Date().toISOString().split('T')[0], tipoPago: 'Nequi', monto: 0, referencia: '' });
    setFile(null);
  };

  const handleUpdatePago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPago) return;
    
    const pagoData: any = {...form, fecha: form.fecha};
    if (form.tipoPago === 'Nequi' && form.referencia) {
        pagoData.referencia = form.referencia;
    } else {
        pagoData.referencia = null;
    }

    await updatePago(editingPago.id, pagoData);
    setPagos(prev => prev.map(p => p.id === editingPago.id ? {...p, ...pagoData} : p).sort((a,b)=> b.fecha.localeCompare(a.fecha)));
    setEditingPago(null);
    setForm({ fecha: new Date().toISOString().split('T')[0], tipoPago: 'Nequi', monto: 0, referencia: '' });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans">
      <div className="flex justify-between items-start mb-8">
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500 border-b-2 border-zinc-800 pb-6">
              Pago del <span className="text-emerald-400">Carro</span>
          </h1>
          {!isAdmin ? (
              <form onSubmit={handleAdminLogin} className="flex gap-2">
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Clave Admin" className="p-2 bg-zinc-900 border border-zinc-700 w-32 md:w-48 text-sm"/>
                  <button type="submit" className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold uppercase transition-colors">Admin</button>
              </form>
          ) : (
              <div className='flex gap-2 items-center'>
                <span className="text-emerald-500 font-bold text-xs uppercase p-2 border border-emerald-900 bg-zinc-900">Admin Activo</span>
                <button onClick={handleLogout} className="px-4 py-2 bg-red-900 hover:bg-red-800 text-xs text-white font-bold uppercase transition-colors">Salir</button>
              </div>
          )}
      </div>

      <div className="mb-12 bg-zinc-900 p-6 border-b-4 border-emerald-500">
        <div className="flex justify-between items-center mb-2">
            <p className="text-zinc-400 uppercase font-bold text-xs md:text-base">Progreso Total (${totalPagado.toLocaleString()} / $50.000.000)</p>
            <p className="font-black text-emerald-400 text-lg md:text-xl">{progreso.toFixed(2)}%</p>
        </div>
        <div className="h-4 bg-zinc-800 w-full rounded-sm overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(progreso, 100)}%` }}/></div>
      </div>

      {isAdmin && (
        <div className="mb-12 max-w-2xl">
            <form onSubmit={editingPago ? handleUpdatePago : handleRegistrarPago} className="p-8 bg-zinc-900 border-2 border-zinc-700/50 shadow-2xl">
                <h2 className="text-xl uppercase mb-6 text-emerald-400 font-black tracking-widest">{editingPago ? 'Editar Pago' : `Registrar Nuevo Pago (Sugerido: ${getQuotaForCount(pagos.length)})`}</h2>
                <div className="space-y-4">
                    <div> <label className="block text-xs uppercase text-zinc-500 mb-1 font-bold">Fecha</label> <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} className="block w-full p-3 bg-zinc-950 border border-zinc-700 text-white"/> </div>
                    <div> <label className="block text-xs uppercase text-zinc-500 mb-1 font-bold">Tipo de Pago</label> <select value={form.tipoPago} onChange={e => setForm({...form, tipoPago: e.target.value as 'Nequi' | 'Efectivo'})} className="block w-full p-3 bg-zinc-950 border border-zinc-700 text-white"> <option value="Nequi">Nequi</option> <option value="Efectivo">Efectivo</option> </select> </div>
                    {form.tipoPago === 'Nequi' && (
                        <div> <label className="block text-xs uppercase text-zinc-500 mb-1 font-bold">Referencia (Nequi)</label> <input type="text" value={form.referencia} onChange={e => setForm({...form, referencia: e.target.value})} className="block w-full p-3 bg-zinc-950 border border-zinc-700 text-white"/> </div>
                    )}
                    <div> <label className="block text-xs uppercase text-zinc-500 mb-1 font-bold">Monto</label> <input type="number" value={form.monto} onChange={e => setForm({...form, monto: parseInt(e.target.value)})} className="block w-full p-3 bg-zinc-950 border border-zinc-700 text-white font-mono text-lg" readOnly={!isAdmin}/> </div>
                    <div> <label className="block text-xs uppercase text-zinc-500 mb-1 font-bold">Comprobante</label> <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full p-3 bg-zinc-950 border border-zinc-700 text-white text-sm"/> </div>
                </div>
                <button type="submit" disabled={!isAdmin} className="w-full mt-8 p-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] transition-all disabled:bg-zinc-800 disabled:text-zinc-500">{editingPago ? 'Guardar Cambios' : 'Registrar Pago'}</button>
                {editingPago && <button type="button" onClick={() => {setEditingPago(null); setForm({ fecha: new Date().toISOString().split('T')[0], tipoPago: 'Nequi', monto: 0, referencia: '' })}} className="w-full mt-2 p-2 bg-zinc-800 hover:bg-zinc-700 text-white uppercase text-xs">Cancelar</button>}
            </form>
        </div>
      )}

      <h2 className="text-3xl font-black uppercase tracking-[0.2em] mt-12 mb-6 text-white border-l-4 border-emerald-500 pl-4"> Historial de Pagos </h2>
      {loading ? <p className="text-zinc-500 font-mono italic">Cargando datos...</p> : (
            <div className="space-y-3">
                {pagos.map(p => (
                    <div key={p.id} className="p-5 bg-zinc-900 border border-zinc-800 flex justify-between items-center group">
                      <div className="flex flex-col">
                        <span className="font-mono text-zinc-500">{p.fecha.split('-').reverse().join('/')} - {p.tipoPago}</span>
                        {p.referencia && <span className="font-mono text-xs text-zinc-400">Ref: {p.referencia}</span>}
                      </div>
                      <div className="flex items-center gap-4">
                        {p.comprobanteUrl && <button onClick={() => setSelectedComprobanteUrl(p.comprobanteUrl!)} className="text-xs text-emerald-500 underline uppercase">Ver Comprobante</button>}
                        <span className="text-emerald-400 font-bold text-xl">${p.monto.toLocaleString()}</span>
                      </div>
                      {isAdmin && (
                          <div className="flex gap-2"> 
                            <button onClick={() => {
                                setEditingPago(p); 
                                setForm({ 
                                    fecha: new Date(p.fecha).toISOString().split('T')[0], 
                                    tipoPago: p.tipoPago, 
                                    monto: p.monto, 
                                    referencia: p.referencia || '' 
                                });
                            }} className="text-zinc-400 hover:text-white">Editar</button>
                            <button onClick={async () => {{ await deletePago(p.id); setPagos(prev => prev.filter(item => item.id !== p.id)); }}} className="text-red-500">Eliminar</button> 
                          </div>
                      )}
                    </div>
                ))}
            </div>
      )}
      {selectedComprobanteUrl && <ComprobanteModal url={selectedComprobanteUrl} onClose={() => setSelectedComprobanteUrl(null)} />}
    </div>
  );
}
