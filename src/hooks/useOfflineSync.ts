import { useState, useEffect, useCallback } from 'react'
import {
  getUnsyncedTransactions,
  markTransactionSynced,
  markTransactionError,
  countUnsynced,
} from '../lib/offlineDB'
import { transactionApi } from '../services/transactionService'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}

export function useOfflineSync() {
  const isOnline = useOnlineStatus()
  const [unsyncedCount, setUnsyncedCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncResult, setLastSyncResult] = useState<{
    success: number
    failed: number
  } | null>(null)

  // Check unsynced count on mount and when coming back online
  const refreshCount = useCallback(async () => {
    const count = await countUnsynced()
    setUnsyncedCount(count)
  }, [])

  useEffect(() => {
    refreshCount()
  }, [refreshCount])

  // Auto-sync when coming back online
  const sync = useCallback(async () => {
    if (!isOnline || isSyncing) return
    const pending = await getUnsyncedTransactions()
    if (pending.length === 0) return

    setIsSyncing(true)
    let success = 0
    let failed = 0

    for (const offlineTx of pending) {
      try {
        await transactionApi.create(offlineTx.payload)
        await markTransactionSynced(offlineTx.id)
        success++
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error'
        await markTransactionError(offlineTx.id, msg)
        failed++
      }
    }

    setIsSyncing(false)
    setLastSyncResult({ success, failed })
    await refreshCount()
  }, [isOnline, isSyncing, refreshCount])

  useEffect(() => {
    if (isOnline) {
      // Small delay to let network stabilize
      const t = setTimeout(sync, 2000)
      return () => clearTimeout(t)
    }
  }, [isOnline, sync])

  return { isOnline, unsyncedCount, isSyncing, lastSyncResult, sync, refreshCount }
}
