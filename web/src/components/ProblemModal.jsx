import { useRef, useState } from 'react'
import { X, Paperclip, UploadCloud, FileText, Image as ImageIcon, Video, Music, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'
import ModalShell from './ModalShell'
import ConfirmModal from './ConfirmModal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthProvider'
import {
  screenUploadedFile,
  formatFileSize,
  generateUUID,
  MAX_ATTACHMENTS_PER_PROBLEM,
  MAX_FILE_SIZE_BYTES,
} from '../lib/fileSecurity'

const MAX_TAGS = 6

export default function ProblemModal({ edit, onClose, onSaved }) {
  const { session } = useAuth()
  const [f, setF] = useState({
    title: edit?.title || '',
    description: edit?.description || '',
    deadline: edit?.deadline || '',
  })
  const [tags, setTags] = useState(edit?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [attachments, setAttachments] = useState(edit?.attachments || [])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [screeningNotice, setScreeningNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErr, setFieldErr] = useState({})
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const initialRef = useRef(
    JSON.stringify({
      title: edit?.title || '',
      description: edit?.description || '',
      deadline: edit?.deadline || '',
      tags: edit?.tags || [],
      attachments: edit?.attachments || [],
    })
  )
  const titleRef = useRef(null)
  const descRef = useRef(null)
  const fileInputRef = useRef(null)

  const set = (k) => (e) => {
    setF((p) => ({ ...p, [k]: e.target.value }))
    setFieldErr((p) => (p[k] ? { ...p, [k]: '' } : p))
  }

  function requestClose() {
    if (busy || uploading) return
    const dirty =
      JSON.stringify({
        title: f.title,
        description: f.description,
        deadline: f.deadline,
        tags,
        attachments,
      }) !== initialRef.current || tagInput.trim() !== ''
    if (dirty) {
      setConfirmDiscard(true)
      return
    }
    onClose()
  }

  function addTag() {
    const t = tagInput.trim()
    if (!t) return
    if (tags.includes(t)) {
      setTagInput('')
      return
    }
    if (tags.length >= MAX_TAGS) {
      setError(`Max ${MAX_TAGS} tags.`)
      return
    }
    setTags([...tags, t])
    setTagInput('')
  }

  async function handleFileUpload(files) {
    if (!files || !files.length) return
    setUploadError('')
    setScreeningNotice('')

    if (attachments.length + files.length > MAX_ATTACHMENTS_PER_PROBLEM) {
      setUploadError(`Maximum ${MAX_ATTACHMENTS_PER_PROBLEM} attachments allowed per problem.`)
      return
    }

    setUploading(true)
    const newAttachments = []

    try {
      for (const file of Array.from(files)) {
        // 1. Run Automated Security Screening
        setScreeningNotice(`Screening ${file.name} for malicious code & verification...`)
        const screenResult = await screenUploadedFile(file)

        // 2. Upload to Supabase Storage bucket 'problem-files'
        setScreeningNotice(`Uploading verified file: ${screenResult.safeName}...`)
        const uid = session?.user?.id || 'anonymous'
        const fileExt = screenResult.ext
        const safePath = `${uid}/${Date.now()}_${generateUUID().slice(0, 8)}.${fileExt}`

        const { data: upData, error: upErr } = await supabase.storage
          .from('problem-files')
          .upload(safePath, file, {
            contentType: file.type || undefined,
            upsert: false,
          })

        if (upErr) {
          console.error('Storage upload error:', upErr)
          throw new Error(
            upErr.message?.includes('size')
              ? `File exceeds size ceiling of ${formatFileSize(MAX_FILE_SIZE_BYTES)}.`
              : `Storage error: ${upErr.message}`
          )
        }

        // 3. Resolve public URL
        const { data: pubData } = supabase.storage
          .from('problem-files')
          .getPublicUrl(upData?.path || safePath)

        newAttachments.push({
          id: generateUUID(),
          name: file.name,
          safeName: screenResult.safeName,
          path: upData?.path || safePath,
          url: pubData?.publicUrl || '',
          size: file.size,
          category: screenResult.category,
          mime: file.type,
          uploadedAt: new Date().toISOString(),
        })
      }

      setAttachments((prev) => [...prev, ...newAttachments])
      setScreeningNotice('Files screened & verified successfully.')
      setTimeout(() => setScreeningNotice(''), 3000)
    } catch (err) {
      console.error('Screening or upload error:', err)
      setUploadError(err.message || 'File upload failed screening.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removeAttachment(id) {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  async function submit() {
    const errs = {}
    if (!f.title.trim()) errs.title = 'Add a problem title.'
    if (!f.description.trim()) errs.description = 'Add a description.'
    if (errs.title || errs.description) {
      setFieldErr(errs)
      ;(errs.title ? titleRef : descRef).current?.focus()
      return
    }
    setFieldErr({})
    setBusy(true)
    const payload = {
      title: f.title.trim(),
      description: f.description.trim(),
      deadline: f.deadline || null,
      tags,
      attachments,
    }
    const { error: e } = edit
      ? await supabase.from('problems').update(payload).eq('id', edit.id)
      : await supabase.from('problems').insert({ ...payload, author_id: session.user.id })
    setBusy(false)
    if (e) {
      console.error(e)
      return setError('Could not save the problem. Check your connection and try again.')
    }
    onSaved()
  }

  return (
    <>
      <ModalShell onRequestClose={requestClose} labelledBy="problem-modal-title" className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <h2 id="problem-modal-title" className="text-lg font-bold">
          {edit ? 'Edit problem' : 'Post a problem'}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Describe a real problem you face. You can attach visual schematics, diagrams, PDFs, and short audio-visual clips to explain complex symptoms.
        </p>

        {error && (
          <div role="alert" className="mt-3 rounded-lg border border-down/30 bg-down/10 px-3 py-2 text-sm text-down">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-4">
          <L label="Problem title *" error={fieldErr.title}>
            <input
              ref={titleRef}
              className="input"
              aria-invalid={!!fieldErr.title || undefined}
              maxLength={200}
              value={f.title}
              onChange={set('title')}
              placeholder="e.g. PCB circuit heat dissipation failure under peak 12V load"
            />
          </L>

          <L label="Description *" error={fieldErr.description}>
            <textarea
              ref={descRef}
              className="input min-h-[100px] resize-y"
              aria-invalid={!!fieldErr.description || undefined}
              maxLength={3000}
              value={f.description}
              onChange={set('description')}
              placeholder="Describe the context, visual/engineering symptoms, who is affected, and what a good solution looks like..."
            />
          </L>

          {/* Multi-Format File Upload Area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wide text-muted">
                Schematics & Media Attachments ({attachments.length}/{MAX_ATTACHMENTS_PER_PROBLEM})
              </span>
              <span className="text-[11px] text-faint flex items-center gap-1">
                <ShieldCheck size={13} className="text-success" /> Max 25MB · Auto-screened
              </span>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                handleFileUpload(e.dataTransfer.files)
              }}
              className={`rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
                isDragging
                  ? 'border-accent bg-accent-soft'
                  : 'border-line hover:border-accent/50 bg-black/5 dark:bg-white/5'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.webp,.svg,.pdf,.mp4,.webm,.ogg,.mp3,.wav"
                className="hidden"
                id="problem-file-input"
                onChange={(e) => handleFileUpload(e.target.files)}
                disabled={uploading || attachments.length >= MAX_ATTACHMENTS_PER_PROBLEM}
              />
              <div className="flex flex-col items-center justify-center gap-1.5">
                <UploadCloud size={24} className="text-muted" />
                <p className="text-xs text-ink font-semibold">
                  Drag & drop schematics, diagrams, PDFs, or media clips here, or{' '}
                  <label htmlFor="problem-file-input" className="cursor-pointer text-accent underline hover:text-accent/80">
                    browse files
                  </label>
                </p>
                <p className="text-[11px] text-muted">
                  Supports Images (PNG, JPG, SVG, WebP), PDFs, Audio/Video (MP4, WebM, MP3, WAV) up to 25MB
                </p>
              </div>
            </div>

            {/* Screening / Uploading feedback */}
            {uploading && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-accent-soft p-2.5 text-xs font-medium text-accent">
                <Loader2 size={14} className="animate-spin" />
                <span>{screeningNotice || 'Screening file for security & uploading...'}</span>
              </div>
            )}
            {screeningNotice && !uploading && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-success/10 p-2 text-xs font-medium text-success">
                <ShieldCheck size={14} />
                <span>{screeningNotice}</span>
              </div>
            )}
            {uploadError && (
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-down/10 p-2 text-xs font-medium text-down">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* List of attachments */}
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((att) => {
                  const Icon =
                    att.category === 'image'
                      ? ImageIcon
                      : att.category === 'video'
                      ? Video
                      : att.category === 'audio'
                      ? Music
                      : FileText

                  return (
                    <div
                      key={att.id}
                      className="flex items-center justify-between rounded-lg border border-line bg-page p-2.5 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {att.category === 'image' && att.url ? (
                          <img
                            src={att.url}
                            alt={att.name}
                            className="h-9 w-9 rounded object-cover border border-line shrink-0"
                          />
                        ) : (
                          <div className="grid h-9 w-9 place-items-center rounded bg-black/5 dark:bg-white/5 shrink-0 text-muted">
                            <Icon size={16} />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-ink truncate">{att.name}</p>
                          <p className="text-[11px] text-muted">
                            <span className="uppercase font-mono">{att.category}</span> · {formatFileSize(att.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(att.id)}
                        className="rounded-full p-1 text-muted hover:text-down hover:bg-black/5"
                        aria-label={`Remove ${att.name}`}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <L label="Needed by">
              <input className="input" type="date" value={f.deadline} onChange={set('deadline')} />
            </L>
          </div>

          <L label={`Domain tags (${tags.length}/${MAX_TAGS})`}>
            {tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                    <button
                      type="button"
                      onClick={() => setTags(tags.filter((x) => x !== t))}
                      aria-label={`Remove ${t}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                className="input"
                maxLength={40}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Add a tag, press Enter"
              />
              <button className="btn-outline shrink-0 px-4" type="button" onClick={addTag}>
                Add
              </button>
            </div>
          </L>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-line pt-4">
          <button className="btn-ghost" onClick={requestClose} disabled={busy || uploading}>
            Cancel
          </button>
          <button className="btn-primary" disabled={busy || uploading} onClick={submit}>
            {busy ? 'Saving...' : edit ? 'Save changes' : 'Post'}
          </button>
        </div>
      </ModalShell>

      {confirmDiscard && (
        <ConfirmModal
          title={edit ? 'Discard your changes?' : 'Discard this problem?'}
          message="Your unsaved text and uploads will be lost."
          confirmLabel="Discard"
          tone="danger"
          onConfirm={() => {
            setConfirmDiscard(false)
            onClose()
          }}
          onClose={() => setConfirmDiscard(false)}
        />
      )}
    </>
  )
}

function L({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">{label}</span>
      {children}
      {error && <p className="mt-1 text-xs font-medium text-down">{error}</p>}
    </label>
  )
}
