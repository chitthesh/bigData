import type { NextPage } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import { FormEvent, useMemo, useState } from 'react'

import { EmptyState } from '../components/EmptyState'
import { useUserContext } from '../components/UserContext'

type Audience = 'followers' | 'public'

function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
      <path d="M4 8h4l2-2h4l2 2h4v11H4V8Z" />
      <circle cx="12" cy="13.5" r="3.25" />
    </svg>
  )
}

function IconGallery() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
      <rect x="5" y="6" width="14" height="12" rx="2" />
      <path d="M8 14.5 10.5 12l2.25 2.25L15 11l2 2" />
      <circle cx="10" cy="10" r="1" />
    </svg>
  )
}

function IconLocation() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
      <path d="M12 21s5-4.35 5-9a5 5 0 0 0-10 0c0 4.65 5 9 5 9Z" />
      <circle cx="12" cy="12" r="1.75" />
    </svg>
  )
}

function IconCaption() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
      <path d="M5 6h14v9H9l-4 4V6Z" />
      <path d="M8 9h8M8 12h6" />
    </svg>
  )
}

function IconHeart() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
      <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.58A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" />
    </svg>
  )
}

function IconComment() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
      <path d="M5 6h14v10H9l-4 4V6Z" />
    </svg>
  )
}

function IconSend() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
      <path d="m4 12 16-7-5.25 7L20 19l-16-7Z" />
    </svg>
  )
}

function IconBookmark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden>
      <path d="M7 5h10v15l-5-3-5 3V5Z" />
    </svg>
  )
}

const CreatePostPage: NextPage = () => {
  const { currentUser } = useUserContext()
  const [caption, setCaption] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [localImageDataUrl, setLocalImageDataUrl] = useState('')
  const [location, setLocation] = useState('')
  const [altText, setAltText] = useState('')
  const [visibility, setVisibility] = useState<Audience>('followers')
  const [audienceOpen, setAudienceOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const previewImage = localImageDataUrl || imageUrl.trim()
  const captionLength = caption.trim().length
  const audienceLabel = useMemo(() => (visibility === 'public' ? 'Public' : 'Followers only'), [visibility])

  async function handleLocalImageUpload(file: File | null) {
    if (!file) {
      setLocalImageDataUrl('')
      return
    }

    const reader = new FileReader()
    const result = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('Failed to read local image'))
      reader.readAsDataURL(file)
    })

    setLocalImageDataUrl(result)
    setImageUrl('')
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const imageToSave = localImageDataUrl || imageUrl.trim()
    if (!currentUser || !imageToSave) {
      return
    }

    setSubmitting(true)
    setSuccessMessage('')

    const response = await fetch('/api/instagram/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        author: currentUser,
        caption: caption.trim(),
        imageUrl: imageToSave,
        location: location.trim(),
        altText: altText.trim(),
        visibility
      })
    })

    setSubmitting(false)

    if (!response.ok) {
      throw new Error('Failed to create post')
    }

    setCaption('')
    setImageUrl('')
    setLocalImageDataUrl('')
    setLocation('')
    setAltText('')
    setVisibility('followers')
    setAudienceOpen(false)
    setSuccessMessage(visibility === 'followers' ? 'Post created. Only followers can view it.' : 'Post created. It is visible to everyone.')
  }

  return (
    <div className="space-y-5">
      <Head>
        <title>Create Post</title>
      </Head>

      {!currentUser ? (
        <EmptyState title="Select a user" message="Choose an active user before creating a post." />
      ) : (
        <form onSubmit={(event) => onSubmit(event).catch((error) => console.error(error))} className="space-y-5">
          <section className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Instagram-style composer</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900">New post</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                Cancel
              </Link>
              <button type="submit" disabled={submitting || !previewImage} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                {submitting ? 'Sharing...' : 'Share'}
              </button>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-[72px_minmax(0,1.05fr)_0.95fr]">
            <aside className="hidden rounded-[2rem] border border-slate-200 bg-white p-3 shadow-sm lg:flex lg:flex-col lg:items-center lg:gap-3">
              <button type="button" onClick={() => document.getElementById('upload-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white transition hover:scale-105">
                <IconGallery />
              </button>
              <button type="button" onClick={() => document.getElementById('location-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200">
                <IconLocation />
              </button>
              <button type="button" onClick={() => document.getElementById('caption-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200">
                <IconCaption />
              </button>
              <button type="button" onClick={() => setAudienceOpen((current) => !current)} className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em]">A</span>
              </button>
            </aside>

            <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Compose</p>
                  <p className="mt-1 text-sm text-slate-500">@{currentUser}</p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{audienceLabel}</div>
              </div>

              <div id="upload-panel" className="space-y-3 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <IconCamera />
                  Media
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleLocalImageUpload(event.target.files?.[0] ?? null).catch((error) => console.error(error))}
                  className="w-full rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm"
                />
                <input
                  value={imageUrl}
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  disabled={!!localImageDataUrl}
                />
                {localImageDataUrl ? (
                  <button type="button" onClick={() => setLocalImageDataUrl('')} className="text-xs font-semibold text-rose-600">
                    Use URL instead
                  </button>
                ) : null}
              </div>

              <div id="location-panel" className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <IconLocation />
                    Location
                  </label>
                  <input
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    placeholder="New York, NY"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                </div>

                <div className="space-y-1 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <IconCaption />
                    Audience
                  </label>
                  <button
                    type="button"
                    onClick={() => setAudienceOpen((current) => !current)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    <span>{audienceLabel}</span>
                    <span className="text-slate-400">▾</span>
                  </button>

                  {audienceOpen ? (
                    <div className="mt-2 space-y-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setVisibility('followers')
                          setAudienceOpen(false)
                        }}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                          visibility === 'followers' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Followers only
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVisibility('public')
                          setAudienceOpen(false)
                        }}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                          visibility === 'public' ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Public
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div id="caption-panel" className="space-y-1 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <IconCaption />
                  Caption and accessibility
                </div>
                <textarea
                  value={caption}
                  onChange={(event) => setCaption(event.target.value)}
                  rows={5}
                  maxLength={2200}
                  placeholder="Write a caption..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
                <textarea
                  value={altText}
                  onChange={(event) => setAltText(event.target.value)}
                  rows={3}
                  placeholder="Describe the image for accessibility"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
                <p className="text-right text-xs text-slate-500">{captionLength}/2200</p>
              </div>

              {successMessage ? <p className="text-sm font-medium text-emerald-600">{successMessage}</p> : null}

              <button type="submit" disabled={submitting || !previewImage} className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 lg:hidden">
                {submitting ? 'Sharing...' : 'Share post'}
              </button>
            </section>

            <aside className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Preview</p>
                  <h2 className="text-lg font-semibold text-slate-900">Phone post</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Live</span>
              </div>

              <div className="mx-auto max-w-sm overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-orange-400 p-0.5">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900">
                        {currentUser.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">@{currentUser}</p>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Just now</p>
                    </div>
                  </div>
                  <span className="text-slate-400">•••</span>
                </div>

                {previewImage ? (
                  <img src={previewImage} alt={altText || 'Post preview'} className="h-[22rem] w-full object-cover" />
                ) : (
                  <div className="flex h-[22rem] items-center justify-center px-8 text-center">
                    <div className="max-w-xs space-y-2">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <IconCamera />
                      </div>
                      <p className="text-sm font-semibold text-slate-900">Add media to preview</p>
                      <p className="text-sm text-slate-500">Your post will appear here like an Instagram draft.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-3 px-4 py-4">
                  <div className="flex items-center gap-4 text-slate-700">
                    <button type="button" className="rounded-full p-1.5 hover:bg-slate-100"><IconHeart /></button>
                    <button type="button" className="rounded-full p-1.5 hover:bg-slate-100"><IconComment /></button>
                    <button type="button" className="rounded-full p-1.5 hover:bg-slate-100"><IconSend /></button>
                    <div className="ml-auto rounded-full p-1.5 hover:bg-slate-100"><IconBookmark /></div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{audienceLabel}</span>
                    {location ? <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{location}</span> : null}
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">@{currentUser}</span>{' '}
                      {caption.trim() || 'Your caption will appear here.'}
                    </p>
                    <p className="text-xs text-slate-500">{altText.trim() || 'Alt text will appear here.'}</p>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={submitting || !previewImage} className="hidden w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60 lg:block">
                {submitting ? 'Sharing...' : 'Share post'}
              </button>
            </aside>
          </div>
        </form>
      )}
    </div>
  )
}

export default CreatePostPage
