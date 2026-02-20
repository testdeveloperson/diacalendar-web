'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export const runtime = 'edge'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: '근무 확인',
    desc: '내 근무 일정을 한눈에 파악하고 변경 사항을 즉시 확인하세요.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 22V12h6v10" />
      </svg>
    ),
    title: '휴가 관리',
    desc: '연차·반차·특별휴가를 손쉽게 신청하고 잔여 일수를 확인하세요.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    title: '메모 & 일정',
    desc: '중요한 메모와 개인 일정을 달력에 기록하고 관리하세요.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: '커뮤니티',
    desc: '동료들과 정보를 나누고 소통하는 전용 커뮤니티를 이용하세요.',
  },
]

export default function LandingPage() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <div className={dark ? 'dark' : ''} style={{ minHeight: '100vh' }}>
      <div
        style={{
          minHeight: '100vh',
          background: dark ? '#0f172a' : '#f8fafc',
          color: dark ? '#e2e8f0' : '#1e293b',
          transition: 'background 0.3s, color 0.3s',
        }}
      >
        {/* Nav */}
        <nav
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            background: dark ? 'rgba(15,23,42,0.85)' : 'rgba(248,250,252,0.85)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(59,130,246,0.4)',
              }}>
                <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>DiaCalendar</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link
                href="/board"
                style={{
                  fontSize: 14, fontWeight: 500,
                  color: dark ? '#94a3b8' : '#64748b',
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: 8,
                }}
              >
                커뮤니티
              </Link>
              <Link
                href="/auth/login"
                style={{
                  fontSize: 14, fontWeight: 600,
                  color: 'white',
                  textDecoration: 'none',
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
                }}
              >
                로그인
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ padding: '80px 24px 60px', textAlign: 'center', maxWidth: 760, margin: '0 auto' }}>
          {/* App icon */}
          <div className="animate-float" style={{ display: 'inline-flex', marginBottom: 32 }}>
            <div style={{
              width: 96, height: 96, borderRadius: 24,
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 20px 60px rgba(59,130,246,0.35)',
            }}>
              <svg width="52" height="52" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={1.6}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
          </div>

          <div className="animate-fadeInUp" style={{ animationDelay: '0ms' }}>
            <div style={{
              display: 'inline-block',
              fontSize: 13, fontWeight: 600,
              color: '#3b82f6',
              background: dark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: 20,
              padding: '4px 14px',
              marginBottom: 20,
              letterSpacing: '0.02em',
            }}>
              근무 · 휴가 · 일정 관리 앱
            </div>
          </div>

          <h1 className="animate-fadeInUp" style={{ animationDelay: '80ms', fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-1px', marginBottom: 20 }}>
            달력 하나로<br />
            <span style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              모든 일정을 관리
            </span>
          </h1>

          <p className="animate-fadeInUp" style={{ animationDelay: '160ms', fontSize: 18, lineHeight: 1.7, color: dark ? '#94a3b8' : '#64748b', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
            근무 확인부터 휴가 신청, 메모까지 —<br />
            복잡한 일정을 <strong style={{ color: dark ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}>DiaCalendar</strong> 하나로 간편하게.
          </p>

          {/* CTA Buttons */}
          <div className="animate-fadeInUp" style={{ animationDelay: '240ms', display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* App Store placeholder */}
            <button
              disabled
              title="준비 중입니다"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 24px',
                borderRadius: 14,
                background: dark ? '#1e293b' : '#0f172a',
                color: 'white',
                border: 'none',
                cursor: 'not-allowed',
                opacity: 0.5,
                fontSize: 14,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, opacity: 0.7, lineHeight: 1 }}>준비 중</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>App Store</div>
              </div>
            </button>

            {/* Play Store placeholder */}
            <button
              disabled
              title="준비 중입니다"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 24px',
                borderRadius: 14,
                background: dark ? '#1e293b' : '#0f172a',
                color: 'white',
                border: 'none',
                cursor: 'not-allowed',
                opacity: 0.5,
                fontSize: 14,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.76c.3.17.65.19.97.08l12.83-7.41-2.89-2.89-10.91 10.22zM.75 1.5C.28 1.93 0 2.6 0 3.44v17.12c0 .84.28 1.51.75 1.94L.87 22.5l9.59-9.59v-.23L.87 3.09.75 1.5zM20.9 10.71l-2.7-1.56-3.19 3.19 3.19 3.18 2.72-1.57c.78-.45.78-1.79-.02-2.24zM4.15.24L17 7.65l-2.89 2.89L3.18.32c.32-.11.68-.09.97.08V.24z"/>
              </svg>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, opacity: 0.7, lineHeight: 1 }}>준비 중</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Google Play</div>
              </div>
            </button>
          </div>

          {/* Community link */}
          <div className="animate-fadeInUp" style={{ animationDelay: '320ms', marginTop: 24 }}>
            <Link
              href="/board"
              style={{
                fontSize: 14,
                color: '#3b82f6',
                textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              커뮤니티 둘러보기
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Feature cards */}
        <section style={{ padding: '20px 24px 80px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 16,
          }}>
            {features.map((f, i) => (
              <div
                key={f.title}
                className="animate-fadeInUp"
                style={{
                  animationDelay: `${400 + i * 80}ms`,
                  padding: '28px 24px',
                  borderRadius: 16,
                  background: dark ? 'rgba(30,41,59,0.6)' : 'white',
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                  boxShadow: dark ? 'none' : '0 2px 20px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: dark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.1)',
                  color: '#3b82f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: dark ? '#94a3b8' : '#64748b', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer
          style={{
            borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            padding: '32px 24px',
            textAlign: 'center',
            fontSize: 13,
            color: dark ? '#475569' : '#94a3b8',
          }}
        >
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', gap: 20 }}>
            <Link href="/board" style={{ color: 'inherit', textDecoration: 'none' }}>커뮤니티</Link>
            <Link href="/auth/login" style={{ color: 'inherit', textDecoration: 'none' }}>로그인</Link>
            <Link href="/auth/signup" style={{ color: 'inherit', textDecoration: 'none' }}>회원가입</Link>
          </div>
          <p style={{ margin: 0 }}>© 2026 DiaCalendar. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}
