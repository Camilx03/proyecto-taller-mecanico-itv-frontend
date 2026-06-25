import { useState } from 'react'
import { ordenApi } from '../../services/api'
import { BadgeEstado, ErrorMsg } from '../shared/Shared'

/**
 * Entrega de vehículo desde Recepción.
 * El recepcionista busca la orden por código y la marca como ENTREGADO.
 */
export default function EntregaVehiculo() {
  const [codigo,    setCodigo]    = useState('')
  const [orden,     setOrden]     = useState(null)
  const [cargando,  setCargando]  = useState(false)
  const [error,     setError]     = useState(null)
  const [entregado, setEntregado] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  async function buscar() {
    const c = codigo.trim().toUpperCase()
    if (!c) return
    setCargando(true); setError(null); setOrden(null); setEntregado(false); setConfirmando(false)
    try {
      const o = await ordenApi.buscarCodigo(c)
      setOrden(o)
    } catch {
      setError(`No se encontró ninguna orden con el código "${c}".`)
    } finally { setCargando(false) }
  }

  async function marcarEntregado() {
    setCargando(true); setError(null)
    try {
      await ordenApi.cambiarEstado(orden.id, 'ENTREGADO')
      setEntregado(true)
      setConfirmando(false)
    } catch (e) { setError(e.message) }
    finally { setCargando(false) }
  }

  function reiniciar() {
    setCodigo(''); setOrden(null); setEntregado(false); setError(null); setConfirmando(false)
  }

  return (
    <div style={{ maxWidth: 560 }}>

      {/* Buscador */}
      <div className="buscador">
        <div className="campo">
          <label>Código de orden</label>
          <input
            value={codigo}
            onChange={e => { setCodigo(e.target.value.toUpperCase()); setError(null) }}
            onKeyDown={e => e.key === 'Enter' && buscar()}
            placeholder="T-0001 o ITV-0002"
            style={{ fontFamily: 'var(--fuente-mono)', letterSpacing: '.06em', textTransform: 'uppercase' }}
          />
        </div>
        <button className="btn btn-primario" onClick={buscar} disabled={cargando || !codigo.trim()}>
          {cargando ? '...' : 'Buscar'}
        </button>
      </div>

      <ErrorMsg msg={error} />

      {/* Resultado */}
      {orden && !entregado && (
        <div className="card mt-14">
          {/* Cabecera */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span className="codigo" style={{ fontSize: 20 }}>{orden.codigo}</span>
            <BadgeEstado estado={orden.estado} />
          </div>

          {/* Datos */}
          <div className="orden-datos" style={{ marginBottom: 14 }}>
            <div className="dato">
              <span className="dato-label">Vehículo</span>
              <span className="dato-valor">{orden.marcaModelo ?? '—'}</span>
            </div>
            <div className="dato">
              <span className="dato-label">Matrícula</span>
              <span className="dato-valor" style={{ fontFamily: 'var(--fuente-mono)' }}>{orden.matricula ?? '—'}</span>
            </div>
            <div className="dato">
              <span className="dato-label">Cliente</span>
              <span className="dato-valor">{orden.clienteNombre ?? '—'}</span>
            </div>
            {orden.clienteTelefono && (
              <div className="dato">
                <span className="dato-label">Teléfono</span>
                <span className="dato-valor">{orden.clienteTelefono}</span>
              </div>
            )}
          </div>

          {orden.observaciones && (
            <p style={{ fontSize: 13, color: 'var(--texto-sub)', marginBottom: 14 }}>
              💬 {orden.observaciones}
            </p>
          )}

          {/* Total */}
          {orden.total > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', fontWeight: 700,
              fontSize: 15, color: 'var(--ambar)', marginBottom: 14,
              paddingTop: 10, borderTop: '1px solid var(--borde)' }}>
              Total a cobrar: {orden.total.toFixed(2)} €
            </div>
          )}

          {/* Acciones según estado */}
          {orden.estado === 'LISTO' && (
            <>
              {!confirmando ? (
                <button className="btn btn-primario btn-bloque" onClick={() => setConfirmando(true)}>
                  Entregar vehículo al cliente →
                </button>
              ) : (
                <div className="confirmar-box">
                  <span className="confirmar-texto">
                    ¿Confirmar entrega de <strong>{orden.marcaModelo}</strong> a <strong>{orden.clienteNombre}</strong>?
                  </span>
                  <button className="btn btn-primario btn-sm" onClick={marcarEntregado} disabled={cargando}>
                    {cargando ? '...' : 'Sí, entregar'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setConfirmando(false)} disabled={cargando}>
                    Cancelar
                  </button>
                </div>
              )}
            </>
          )}

          {orden.estado === 'ENTREGADO' && (
            <div style={{ color: 'var(--c-ENTREGADO)', fontSize: 13 }}>
              ✓ Este vehículo ya fue entregado anteriormente.
            </div>
          )}

          {!['LISTO', 'ENTREGADO'].includes(orden.estado) && (
            <div style={{ fontSize: 13, color: 'var(--texto-sub)' }}>
              ⏳ El vehículo todavía no está listo para entregar.
              Estado actual: <BadgeEstado estado={orden.estado} />
            </div>
          )}

          <ErrorMsg msg={error} />

          <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={reiniciar}>
            Buscar otro código
          </button>
        </div>
      )}

      {/* Confirmación de entrega exitosa */}
      {entregado && orden && (
        <div className="card mt-14">
          <div className="exito" style={{ padding: '24px 16px' }}>
            <div className="exito-icono">🤝</div>
            <h2 className="exito-titulo" style={{ fontSize: 20 }}>Vehículo entregado</h2>
            <p style={{ fontSize: 14, color: 'var(--texto-sub)', textAlign: 'center', lineHeight: 1.8 }}>
              <strong>{orden.marcaModelo}</strong> — {orden.matricula}<br />
              Cliente: {orden.clienteNombre}<br />
              {orden.total > 0 && <><strong style={{ color: 'var(--ambar)' }}>Total cobrado: {orden.total.toFixed(2)} €</strong></>}
            </p>
            <button className="btn btn-primario" onClick={reiniciar}>
              Nueva entrega
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
