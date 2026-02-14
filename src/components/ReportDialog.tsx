'use client'

import { useState } from 'react'
import { ReportReason, REPORT_REASONS } from '@/lib/types'

interface ReportDialogProps {
  onSubmit: (reason: ReportReason) => void
  onClose: () => void
  loading: boolean
}

export default function ReportDialog({ onSubmit, onClose, loading }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>('SPAM')

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-slideUp">
        <h2 className="text-lg font-bold mb-1">신고하기</h2>
        <p className="text-sm text-gray-400 mb-5">신고 사유를 선택해주세요</p>

        <div className="space-y-2 mb-6">
          {REPORT_REASONS.map(r => (
            <label
              key={r.value}
              className={`flex items-center gap-3 cursor-pointer p-3 rounded-xl border transition-all ${
                reason === r.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="accent-blue-600"
              />
              <span className="text-sm font-medium">{r.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={() => onSubmit(reason)}
            disabled={loading}
            className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 shadow-sm"
          >
            {loading ? '신고 중...' : '신고'}
          </button>
        </div>
      </div>
    </div>
  )
}
