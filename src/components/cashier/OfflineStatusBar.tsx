import { useTranslation } from 'react-i18next'
import { WifiOff, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react'
import { useOfflineSync } from '../../hooks/useOfflineSync'
import { cn } from '../../lib/utils'

export default function OfflineStatusBar() {
  const { t } = useTranslation()
  const { isOnline, unsyncedCount, isSyncing, lastSyncResult, sync } = useOfflineSync()

  // Online, nothing pending — don't show anything
  if (isOnline && unsyncedCount === 0 && !lastSyncResult) return null

  return (
    <div className={cn(
      'px-5 py-2 flex items-center gap-3 text-sm font-body transition-all flex-shrink-0',
      !isOnline
        ? 'bg-amber-50 border-b border-amber-200'
        : unsyncedCount > 0
        ? 'bg-blue-50 border-b border-blue-200'
        : 'bg-green-50 border-b border-green-200'
    )}>
      {/* Status icon */}
      {!isOnline ? (
        <WifiOff className="w-4 h-4 text-amber-500 flex-shrink-0" />
      ) : isSyncing ? (
        <RefreshCw className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
      ) : unsyncedCount > 0 ? (
        <AlertTriangle className="w-4 h-4 text-blue-500 flex-shrink-0" />
      ) : (
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
      )}

      {/* Message */}
      <span className={cn(
        'flex-1 text-xs',
        !isOnline ? 'text-amber-700' :
        unsyncedCount > 0 ? 'text-blue-700' : 'text-green-700'
      )}>
        {!isOnline && (
          <>{t('cashier.offlineDesc')}</>
        )}
        {isOnline && isSyncing && (
          <>Menyinkronkan {unsyncedCount} transaksi offline...</>
        )}
        {isOnline && !isSyncing && unsyncedCount > 0 && (
          <>{unsyncedCount} transaksi offline belum tersinkron</>
        )}
        {isOnline && !isSyncing && unsyncedCount === 0 && lastSyncResult && (
          <>Sinkronisasi selesai — {lastSyncResult.success} transaksi berhasil
          {lastSyncResult.failed > 0 && `, ${lastSyncResult.failed} gagal`}</>
        )}
      </span>

      {/* Manual sync button */}
      {isOnline && unsyncedCount > 0 && !isSyncing && (
        <button
          onClick={sync}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 underline flex-shrink-0"
        >
          Sinkronkan sekarang
        </button>
      )}
    </div>
  )
}
