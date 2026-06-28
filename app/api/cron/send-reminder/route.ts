import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// JST（日本時間）の現在時刻を HH:MM 形式で返す
function getCurrentJSTTime(): string {
  const now = new Date()
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const h = jst.getUTCHours().toString().padStart(2, '0')
  const m = jst.getUTCMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

export async function GET(request: Request) {
  // CRON_SECRET でアクセスを保護
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const currentTime = getCurrentJSTTime()

  // Service Role Key でRLSをバイパスしてすべてのユーザーを取得
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, notification_time')
    .eq('notification_enabled', true)
    .eq('notification_time', currentTime)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ message: 'No reminders at this time', time: currentTime })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  // 各ユーザーにメール送信
  const results = await Promise.allSettled(
    profiles.map(async (profile) => {
      if (!profile.email) return null

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
          to: profile.email,
          subject: '📚 今日の宅建ミニ学習の時間です！',
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb;">
              <div style="background: white; border-radius: 16px; padding: 28px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
                <div style="text-align: center; margin-bottom: 20px;">
                  <div style="display: inline-block; background: #eff6ff; border-radius: 12px; padding: 12px 16px; font-size: 28px;">📚</div>
                </div>
                <h2 style="color: #1e293b; font-size: 20px; text-align: center; margin: 0 0 8px;">今日の宅建ミニ学習</h2>
                <p style="color: #64748b; text-align: center; font-size: 14px; margin: 0 0 24px;">
                  5問・約5分で今日の学習を完了しましょう！
                </p>
                <a href="${appUrl}/study"
                   style="display: block; background: #2563eb; color: white; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; text-align: center;">
                  今すぐ学習を始める →
                </a>
                <p style="margin: 20px 0 0; color: #94a3b8; font-size: 12px; text-align: center;">
                  通知設定の変更は
                  <a href="${appUrl}/settings" style="color: #2563eb;">設定画面</a>
                  から行えます。
                </p>
              </div>
            </div>
          `,
        }),
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Resend error for ${profile.email}: ${body}`)
      }

      return profile.email
    })
  )

  const succeeded = results.filter((r) => r.status === 'fulfilled' && r.value).length
  const failed = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({
    time: currentTime,
    total: profiles.length,
    succeeded,
    failed,
  })
}
