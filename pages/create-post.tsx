import type { NextPage } from 'next'
import Head from 'next/head'
import { FormEvent, useState } from 'react'

import { EmptyState } from '../components/EmptyState'
import { useUserContext } from '../components/UserContext'

const CreatePostPage: NextPage = () => {
  const { currentUser } = useUserContext()
  const [caption, setCaption] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [localImageDataUrl, setLocalImageDataUrl] = useState('')
  const [visibility, setVisibility] = useState<'followers' | 'public'>('followers')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const previewImage = localImageDataUrl || imageUrl.trim()

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
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        author: currentUser,
        caption: caption.trim(),
        imageUrl: imageToSave,
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
    setVisibility('followers')
    setSuccessMessage(
      visibility === 'followers'
        ? 'Post created. Only followers can view it.'
        : 'Post created. It is visible to everyone.'
    )
  }

  return (
    <div className="space-y-6">
      <Head>
        <title>Create Post</title>
      </Head>

      <section className="rounded-3xl bg-gradient-to-r from-fuchsia-500 via-rose-500 to-orange-400 p-6 text-white shadow-lg">
        <h1 className="text-3xl font-semibold">Create Post</h1>
        <p className="mt-2 text-sm text-white/90">Share an image and caption with your followers.</p>
      </section>

      {!currentUser ? (
        <EmptyState title="Select a user" message="Choose an active user before creating a post." />
      ) : (
        <form onSubmit={(event) => onSubmit(event).catch((error) => console.error(error))} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Author</label>
            <input value={`@${currentUser}`} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Upload image (mock)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleLocalImageUpload(event.target.files?.[0] ?? null).catch((error) => console.error(error))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <p className="text-xs text-slate-500">Choose a local file for preview or use the URL field below.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Image URL</label>
            <input
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
              disabled={!!localImageDataUrl}
            />
            {localImageDataUrl ? (
              <button
                type="button"
                onClick={() => setLocalImageDataUrl('')}
                className="text-xs font-semibold text-rose-600"
              >
                Remove local image and use URL instead
              </button>
            ) : null}
          </div>

          {previewImage ? (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Preview</label>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img src={previewImage} alt="Post preview" className="max-h-80 w-full object-cover" />
              </div>
            </div>
          ) : null}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Audience</label>
            <select
              value={visibility}
              onChange={(event) => setVisibility(event.target.value === 'public' ? 'public' : 'followers')}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              <option value="followers">Followers only</option>
              <option value="public">Public</option>
            </select>
            <p className="text-xs text-slate-500">Followers-only posts are visible only to people who follow you.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Caption</label>
            <textarea
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              rows={4}
              placeholder="Write a caption..."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </div>

          <button type="submit" disabled={submitting || !previewImage} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? 'Posting...' : 'Publish Post'}
          </button>

          {successMessage ? <p className="text-sm font-medium text-emerald-600">{successMessage}</p> : null}
        </form>
      )}
    </div>
  )
}

export default CreatePostPage
