import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { invoiceApi } from '../api.js'

const InvoiceContext = createContext(null)

export function InvoiceProvider({ children }) {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchInvoices = useCallback(async () => {
    try {
      const data = await invoiceApi.getAll()
      setInvoices(data)
    } catch (err) {
      console.error('Error cargando facturas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  async function captureFiscalData(donationId, fiscalData) {
    const result = await invoiceApi.captureFiscalData(donationId, fiscalData)
    fetchInvoices() // Refresh
    return result
  }

  async function generateCFDI(invoiceId) {
    const result = await invoiceApi.generateCFDI(invoiceId)
    fetchInvoices()
    return result
  }

  async function sendCFDI(invoiceId) {
    const result = await invoiceApi.sendCFDI(invoiceId)
    fetchInvoices()
    return result
  }

  function getInvoicesByStatus(status) {
    return invoices.filter(i => i.status === status)
  }

  function getPendingInvoices() {
    return invoices.filter(i => ['pending', 'fiscal_data_captured'].includes(i.status))
  }

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        loading,
        refreshInvoices: fetchInvoices,
        captureFiscalData,
        generateCFDI,
        sendCFDI,
        getInvoicesByStatus,
        getPendingInvoices,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  )
}

export function useInvoices() {
  const context = useContext(InvoiceContext)
  if (!context) {
    throw new Error('useInvoices debe usarse dentro de un InvoiceProvider')
  }
  return context
}
