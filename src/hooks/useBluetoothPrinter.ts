import { useState, useCallback } from 'react'
import { usePrinterStore } from '../stores/printerStore'

// Common BLE service UUIDs for thermal printers
// Most Chinese 58mm BLE printers use one of these
const BLE_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',   // Zjiang / Xprinter BLE
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',   // Several common models
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',   // Microchip RN42 BLE
  '0000ff00-0000-1000-8000-00805f9b34fb',   // Generic BLE serial
]

const BLE_WRITE_CHARS = [
  '00002af1-0000-1000-8000-00805f9b34fb',   // Zjiang write char
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',  // Some models
  '49535343-8841-43f4-a8d4-ecbe34729bb3',  // Microchip
  '0000ff02-0000-1000-8000-00805f9b34fb',  // Generic
  '0000ff01-0000-1000-8000-00805f9b34fb',  // Generic alt
]

// Max bytes per BLE write (MTU limit)
const CHUNK_SIZE = 512

export type BluetoothStatus = 'idle' | 'connecting' | 'connected' | 'printing' | 'error'

export function useBluetoothPrinter() {
  const { deviceName, isConnected, characteristic, setDevice, setDisconnected } = usePrinterStore()
  const [status, setStatus] = useState<BluetoothStatus>(isConnected ? 'connected' : 'idle')
  const [error, setError] = useState<string | null>(null)

  const isSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator

  const connect = useCallback(async () => {
    if (!isSupported) {
      setError('Browser Anda tidak mendukung Web Bluetooth. Gunakan Chrome atau Edge.')
      return false
    }

    setStatus('connecting')
    setError(null)

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BLE_PRINTER_SERVICES,
      })

      device.addEventListener('gattserverdisconnected', () => {
        setDisconnected()
        setStatus('idle')
      })

      const server = await device.gatt!.connect()
      let foundChar: BluetoothRemoteGATTCharacteristic | null = null

      // Try each known service UUID
      for (const serviceUuid of BLE_PRINTER_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid)
          // Try each known write characteristic UUID
          for (const charUuid of BLE_WRITE_CHARS) {
            try {
              const char = await service.getCharacteristic(charUuid)
              if (char.properties.write || char.properties.writeWithoutResponse) {
                foundChar = char
                break
              }
            } catch {
              // char not found in this service, continue
            }
          }
          if (foundChar) break
        } catch {
          // service not found, try next
        }
      }

      // If none of the known UUIDs matched, try to discover any writable char
      if (!foundChar) {
        try {
          const services = await server.getPrimaryServices()
          outer: for (const svc of services) {
            const chars = await svc.getCharacteristics()
            for (const c of chars) {
              if (c.properties.write || c.properties.writeWithoutResponse) {
                foundChar = c
                break outer
              }
            }
          }
        } catch {
          // discovery failed
        }
      }

      if (!foundChar) {
        await device.gatt!.disconnect()
        throw new Error('Printer tidak terdeteksi. Pastikan printer sudah menyala dan dalam mode pairing.')
      }

      setDevice(device.name ?? 'Printer', foundChar)
      setStatus('connected')
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi gagal'
      // User cancelled the picker — don't show error
      if (msg.includes('cancelled') || msg.includes('chooser')) {
        setStatus('idle')
      } else {
        setError(msg)
        setStatus('error')
      }
      return false
    }
  }, [isSupported, setDevice, setDisconnected])

  const disconnect = useCallback(async () => {
    if (characteristic?.service?.device?.gatt?.connected) {
      try {
        characteristic.service.device.gatt.disconnect()
      } catch {
        // ignore
      }
    }
    setDisconnected()
    setStatus('idle')
    setError(null)
  }, [characteristic, setDisconnected])

  const print = useCallback(async (data: Uint8Array): Promise<boolean> => {
    if (!characteristic) {
      setError('Printer belum terhubung.')
      return false
    }

    setStatus('printing')
    setError(null)

    try {
      // Send in chunks to respect BLE MTU
      for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
        const chunk = data.slice(offset, offset + CHUNK_SIZE)
        if (characteristic.properties.writeWithoutResponse) {
          await characteristic.writeValueWithoutResponse(chunk)
        } else {
          await characteristic.writeValueWithResponse(chunk)
        }
        // Small delay between chunks to avoid buffer overflow
        if (offset + CHUNK_SIZE < data.length) {
          await new Promise((r) => setTimeout(r, 20))
        }
      }

      setStatus('connected')
      return true
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cetak gagal'
      setError(msg)
      setStatus('error')

      // If disconnected mid-print, clean up
      if (msg.includes('disconnected') || msg.includes('GATT')) {
        setDisconnected()
        setStatus('idle')
      }
      return false
    }
  }, [characteristic, setDisconnected])

  return {
    isSupported,
    isConnected,
    deviceName,
    status,
    error,
    connect,
    disconnect,
    print,
  }
}
