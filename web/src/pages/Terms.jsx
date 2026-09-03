import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthProvider'
import { AGREEMENT_URLS, CURRENT_TERMS_VERSION, AGREEMENT_TEXTS } from '../lib/termsConfig'
import Logo from '../components/Logo'
import Spinner from '../components/Spinner'

export default function Terms() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, profileLoaded, refreshProfile } = useAuth()

  const [step, setStep] = useState(1)
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Determine the current incomplete step from profile
  useEffect(() => {
    if (!profileLoaded) return
    if (!profile) {
      navigate('/', { replace: true })
      return
    }
    // If all steps accepted and version matches, go to dashboard (will hit password change gate)
    if (
      profile.terms_step1_accepted &&
      profile.terms_step2_accepted &&
      profile.terms_step3_accepted &&
      profile.terms_version === CURRENT_TERMS_VERSION
    ) {
      navigate('/', { replace: true })
      return
    }
    // Find first missing step
    if (!profile.terms_step1_accepted) setStep(1)
    else if (!profile.terms_step2_accepted) setStep(2)
    else if (!profile.terms_step3_accepted) setStep(3)
    else setStep(1) // fallback
  }, [profile, profileLoaded, navigate])

  async function handleAccept() {
    if (!accepted) {
      setError('You must accept the terms to continue.')
      return
    }
    setBusy(true)
    setError('')

    const updates = {
      [`terms_step${step}_accepted`]: true,
      [`terms_step${step}_accepted_at`]: new Date().toISOString(),
      terms_version: CURRENT_TERMS_VERSION,
    }

    const { error: updErr } = await supabase.from('profiles').update(updates).eq('id', profile.id)
    if (updErr) {
      setBusy(false)
      setError('Could not record acceptance. Please try again.')
      return
    }

    await refreshProfile()
    setBusy(false)

    // Move to next step or dashboard
    if (step < 3) {
      setStep(step + 1)
      setAccepted(false)
    } else {
      navigate('/', { replace: true })
    }
  }

  // Show loading while profile not ready
  if (!profileLoaded) {
    return (
      <div className="grid min-h-screen place-items-center bg-page">
        <div className="flex flex-col items-center gap-4">
          <Logo className="h-10 w-auto" />
          <Spinner size={24} />
        </div>
      </div>
    )
  }

  if (!profile) {
    return null // will be redirected by effect
  }

  // If already fully accepted, redirect (handled by effect)
  if (
    profile.terms_step1_accepted &&
    profile.terms_step2_accepted &&
    profile.terms_step3_accepted &&
    profile.terms_version === CURRENT_TERMS_VERSION
  ) {
    return null
  }

  const agreementText = AGREEMENT_TEXTS[step] || ''
  const agreementUrl = AGREEMENT_URLS[step] || '#'

  return (
    <main className="grid min-h-screen place-items-center bg-page px-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6 flex justify-center"><Logo className="h-10 w-auto" /></div>

        <div className="card p-6">
          <div className="mb-4 text-sm text-muted">Step {step} of 3</div>

          <h1 className="text-lg font-bold mb-2">Terms & Conditions</h1>

          <div className="mb-4 prose prose-sm max-w-none text-ink">
            {agreementText.split('\n').map((line, i) => (
              <p key={i} className="whitespace-pre-wrap">{line}</p>
            ))}
          </div>

          <div className="mb-4 flex items-start gap-2">
            <input
              type="checkbox"
              id={`accept-step-${step}`}
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 accent-accent"
              disabled={busy}
            />
            <label htmlFor={`accept-step-${step}`} className="text-sm text-ink">
              I have read and agree to the Terms & Conditions.
              {' '}
              <a
                href={agreementUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline hover:text-accent/80"
              >
                Read Step {step} Terms & Conditions →
              </a>
            </label>
          </div>

          {error && (
            <div role="alert" className="mb-4 rounded-lg border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">
              {error}
            </div>
          )}

          <button
            onClick={handleAccept}
            disabled={busy || !accepted}
            className="btn-primary w-full"
          >
            {busy ? 'Saving...' : step < 3 ? 'Continue to next step' : 'Continue to password setup'}
          </button>
        </div>
      </div>
    </main>
  )
}