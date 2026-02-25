'use client'

import { useState } from 'react'
import { ReportReason, REPORT_REASONS } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface ReportDialogProps {
  onSubmit: (reason: ReportReason) => void
  onClose: () => void
  loading: boolean
}

export default function ReportDialog({ onSubmit, onClose, loading }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason>('SPAM')

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>신고하기</DialogTitle>
          <DialogDescription>신고 사유를 선택해주세요</DialogDescription>
        </DialogHeader>

        <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)} className="space-y-2">
          {REPORT_REASONS.map(r => (
            <label
              key={r.value}
              className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
                reason === r.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value={r.value} id={r.value} />
              <Label htmlFor={r.value} className="cursor-pointer font-medium">{r.label}</Label>
            </label>
          ))}
        </RadioGroup>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button variant="destructive" onClick={() => onSubmit(reason)} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            신고
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
