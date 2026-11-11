'use client';
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { SiteService } from '@/Service/SiteService';
export function CopyEmailButton() {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <>
      <button
        className="button-secondary"
        onClick={async () => {
          try {
            await SiteService.copyEmail();
            setCopied(true);
            setFailed(false);
          } catch {
            setFailed(true);
          }
        }}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? '已複製信箱' : '複製信箱'}
      </button>
      <span className="copy-feedback" role="status">
        {failed ? '無法自動複製，請選取上方信箱地址手動複製。' : copied ? '信箱地址已複製。' : ''}
      </span>
    </>
  );
}
