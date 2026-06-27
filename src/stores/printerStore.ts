import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PrinterStore {
  // Persisted
  deviceName: string | null
  paperWidth: 58 | 80   // mm

  // In-memory only (not serializable)
  characteristic: BluetoothRemoteGATTCharacteristic | null
  isConnected: boolean

  setDevice: (name: string, char: BluetoothRemoteGATTCharacteristic) => void
  setDisconnected: () => void
  setPaperWidth: (w: 58 | 80) => void
}

export const usePrinterStore = create<PrinterStore>()(
  persist(
    (set) => ({
      deviceName: null,
      paperWidth: 58,
      characteristic: null,
      isConnected: false,

      setDevice: (name, char) =>
        set({ deviceName: name, characteristic: char, isConnected: true }),

      setDisconnected: () =>
        set({ characteristic: null, isConnected: false }),

      setPaperWidth: (w) => set({ paperWidth: w }),
    }),
    {
      name: 'sajiin-printer',
      // Only persist name & paperWidth — characteristic is runtime-only
      partialize: (s) => ({ deviceName: s.deviceName, paperWidth: s.paperWidth }),
    }
  )
)
