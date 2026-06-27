import { describe, it, expect, beforeEach } from 'vitest'
import { usePrinterStore } from '../stores/printerStore'

// Reset Zustand store state before each test
beforeEach(() => {
  usePrinterStore.setState({
    deviceName: null,
    paperWidth: 58,
    characteristic: null,
    isConnected: false,
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('printerStore — initial state', () => {
  it('deviceName is null initially', () => {
    expect(usePrinterStore.getState().deviceName).toBeNull()
  })

  it('isConnected is false initially', () => {
    expect(usePrinterStore.getState().isConnected).toBe(false)
  })

  it('characteristic is null initially', () => {
    expect(usePrinterStore.getState().characteristic).toBeNull()
  })

  it('paperWidth defaults to 58mm', () => {
    expect(usePrinterStore.getState().paperWidth).toBe(58)
  })
})

// ─── setDevice ────────────────────────────────────────────────────────────────

describe('setDevice()', () => {
  it('sets deviceName', () => {
    const fakeChar = {} as BluetoothRemoteGATTCharacteristic
    usePrinterStore.getState().setDevice('Printer XP-58', fakeChar)
    expect(usePrinterStore.getState().deviceName).toBe('Printer XP-58')
  })

  it('sets isConnected to true', () => {
    const fakeChar = {} as BluetoothRemoteGATTCharacteristic
    usePrinterStore.getState().setDevice('Printer XP-58', fakeChar)
    expect(usePrinterStore.getState().isConnected).toBe(true)
  })

  it('stores the characteristic reference', () => {
    const fakeChar = { id: 'char-1' } as unknown as BluetoothRemoteGATTCharacteristic
    usePrinterStore.getState().setDevice('Printer', fakeChar)
    expect(usePrinterStore.getState().characteristic).toBe(fakeChar)
  })
})

// ─── setDisconnected ──────────────────────────────────────────────────────────

describe('setDisconnected()', () => {
  it('sets isConnected to false', () => {
    const fakeChar = {} as BluetoothRemoteGATTCharacteristic
    usePrinterStore.getState().setDevice('Printer', fakeChar)
    usePrinterStore.getState().setDisconnected()
    expect(usePrinterStore.getState().isConnected).toBe(false)
  })

  it('clears characteristic', () => {
    const fakeChar = {} as BluetoothRemoteGATTCharacteristic
    usePrinterStore.getState().setDevice('Printer', fakeChar)
    usePrinterStore.getState().setDisconnected()
    expect(usePrinterStore.getState().characteristic).toBeNull()
  })

  it('preserves deviceName after disconnect (for display)', () => {
    const fakeChar = {} as BluetoothRemoteGATTCharacteristic
    usePrinterStore.getState().setDevice('Printer XP-58', fakeChar)
    usePrinterStore.getState().setDisconnected()
    // deviceName is kept so user sees which printer was last connected
    expect(usePrinterStore.getState().deviceName).toBe('Printer XP-58')
  })
})

// ─── setPaperWidth ────────────────────────────────────────────────────────────

describe('setPaperWidth()', () => {
  it('sets paper width to 80mm', () => {
    usePrinterStore.getState().setPaperWidth(80)
    expect(usePrinterStore.getState().paperWidth).toBe(80)
  })

  it('sets paper width back to 58mm', () => {
    usePrinterStore.getState().setPaperWidth(80)
    usePrinterStore.getState().setPaperWidth(58)
    expect(usePrinterStore.getState().paperWidth).toBe(58)
  })
})

// ─── connect → disconnect flow ────────────────────────────────────────────────

describe('connect → disconnect lifecycle', () => {
  it('isConnected toggles correctly through full lifecycle', () => {
    const store = usePrinterStore.getState()

    expect(store.isConnected).toBe(false)

    store.setDevice('TestPrinter', {} as BluetoothRemoteGATTCharacteristic)
    expect(usePrinterStore.getState().isConnected).toBe(true)

    usePrinterStore.getState().setDisconnected()
    expect(usePrinterStore.getState().isConnected).toBe(false)
  })

  it('can reconnect after disconnect', () => {
    const store = usePrinterStore.getState()

    store.setDevice('Printer A', {} as BluetoothRemoteGATTCharacteristic)
    store.setDisconnected()

    const newChar = { id: 'new' } as unknown as BluetoothRemoteGATTCharacteristic
    usePrinterStore.getState().setDevice('Printer B', newChar)

    expect(usePrinterStore.getState().deviceName).toBe('Printer B')
    expect(usePrinterStore.getState().isConnected).toBe(true)
    expect(usePrinterStore.getState().characteristic).toBe(newChar)
  })
})
