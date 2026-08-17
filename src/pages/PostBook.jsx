import { useState } from 'react'
import { ChevronLeft, Camera, X, Video, ShieldCheck } from 'lucide-react'
import Button from '../components/Button'
import Input from '../components/Input'
import { CONDITIONS } from '../components/ConditionBadge'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const CATEGORIES = ['Engineering', 'Commerce', 'Science', 'Medical', 'Arts', 'Other']
const VIDEO_REQUIRED_THRESHOLD = 300
const MAX_VIDEO_MB = 50

export default function PostBook({ editBook = null, onBack, onPosted }) {
  const { user, profile } = useAuth()
  const isEditMode = !!editBook

  const [existingImages, setExistingImages] = useState(editBook?.images || [])
  const [newImages, setNewImages] = useState([])
  const [existingVideoUrl, setExistingVideoUrl] = useState(editBook?.video_url || null)
  const [newVideo, setNewVideo] = useState(null)
  const [videoError, setVideoError] = useState('')

  const [title, setTitle] = useState(editBook?.title || '')
  const [author, setAuthor] = useState(editBook?.author || '')
  const [subject, setSubject] = useState(editBook?.subject || '')
  const [category, setCategory] = useState(editBook?.category || 'Engineering')
  const [condition, setCondition] = useState(editBook?.condition || 4)
  const [description, setDescription] = useState(editBook?.description || '')
  const [price, setPrice] = useState(editBook?.price?.toString() || '')
  const [originalPrice, setOriginalPrice] = useState(editBook?.original_price?.toString() || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const totalImageCount = existingImages.length + newImages.length
  const hasVideo = !!(existingVideoUrl || newVideo)
  const platformFee = price ? Math.max(8, Math.round(Number(price) * 0.02)) : 0
  const videoRequired = Number(price) >= VIDEO_REQUIRED_THRESHOLD

  function handleVideoPick(e) {
    const file = e.target.files[0]
    if (!file) return
    setVideoError('')
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) { setVideoError(`Video must be under ${MAX_VIDEO_MB}MB`); return }
    setExistingVideoUrl(null)
    setNewVideo({ file, preview: URL.createObjectURL(file) })
  }

  function handleImagePick(e) {
    const remainingSlots = 4 - totalImageCount
    const files = Array.from(e.target.files).slice(0, remainingSlots)
    const withPreviews = files.map((file) => ({ file, preview: URL.createObjectURL(file) }))
    setNewImages((prev) => [...prev, ...withPreviews].slice(0, remainingSlots + prev.length))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (totalImageCount === 0) { setError('Add at least one photo of the book'); return }
    if (!title || !price) { setError('Title and price are required'); return }
    if (Number(price) <= 0) { setError('Price must be greater than ₹0'); return }
    if (originalPrice && Number(price) >= Number(originalPrice)) {
      setError('Your selling price must be less than the original price')
      return
    }
    if (videoRequired && !hasVideo) { setError(`Books priced ₹${VIDEO_REQUIRED_THRESHOLD}+ require a verification video`); return }

    setLoading(true)
    try {
      // Upload new images
      const uploadedUrls = []
      for (const img of newImages) {
        const fileExt = img.file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('book-images').upload(fileName, img.file)
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('book-images').getPublicUrl(fileName)
        uploadedUrls.push(urlData.publicUrl)
      }
      const finalImages = [...existingImages, ...uploadedUrls]

      // Upload video if new one selected
      let finalVideoUrl = existingVideoUrl
      if (newVideo) {
        const fileExt = newVideo.file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-vid.${fileExt}`
        const { error: videoUploadError } = await supabase.storage.from('book-images').upload(fileName, newVideo.file)
        if (videoUploadError) throw videoUploadError
        const { data: videoUrlData } = supabase.storage.from('book-images').getPublicUrl(fileName)
        finalVideoUrl = videoUrlData.publicUrl
      }

      const payload = {
        title, author, subject, category, description, condition,
        price: Number(price),
        original_price: originalPrice ? Number(originalPrice) : null,
        images: finalImages,
        video_url: finalVideoUrl,
        // Inherit seller's location from profile
        city: profile?.city || null,
        lat: profile?.lat || null,
        lng: profile?.lng || null,
      }

      if (isEditMode) {
        const { error: updateError } = await supabase.from('books').update(payload).eq('id', editBook.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('books').insert({ seller_id: user.id, ...payload })
        if (insertError) throw insertError
      }

      onPosted?.()
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream pb-28">
      <div className="bg-navy px-4 pt-5 pb-4 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={onBack} className="text-white"><ChevronLeft size={22} /></button>
        <h1 className="font-display font-bold text-white text-base">{isEditMode ? 'Edit Listing' : 'Post a Book'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-5 flex flex-col gap-5">
        {/* Photo upload */}
        <div>
          <label className="block text-xs font-semibold text-navy mb-2 font-display">
            Photos <span className="text-muted font-normal">(up to 4, first is cover)</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {existingImages.map((url, idx) => (
              <div key={`e-${idx}`} className="relative aspect-square rounded-button overflow-hidden border border-border">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setExistingImages((p) => p.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-navy/80 flex items-center justify-center">
                  <X size={12} className="text-white" />
                </button>
                {idx === 0 && <span className="absolute bottom-1 left-1 bg-orange text-white text-[8px] font-bold px-1.5 py-0.5 rounded">COVER</span>}
              </div>
            ))}
            {newImages.map((img, idx) => (
              <div key={`n-${idx}`} className="relative aspect-square rounded-button overflow-hidden border border-border">
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setNewImages((p) => p.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-navy/80 flex items-center justify-center">
                  <X size={12} className="text-white" />
                </button>
                {existingImages.length === 0 && idx === 0 && <span className="absolute bottom-1 left-1 bg-orange text-white text-[8px] font-bold px-1.5 py-0.5 rounded">COVER</span>}
              </div>
            ))}
            {totalImageCount < 4 && (
              <label className="aspect-square rounded-button border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer bg-white">
                <Camera size={18} className="text-muted" />
                <span className="text-[9px] text-muted font-medium">Add</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImagePick} />
              </label>
            )}
          </div>
        </div>

        {/* Video upload */}
        <div>
          <label className="block text-xs font-semibold text-navy mb-2 font-display flex items-center gap-1.5">
            Verification Video
            {videoRequired
              ? <span className="text-danger font-bold">(Required for ₹{VIDEO_REQUIRED_THRESHOLD}+)</span>
              : <span className="text-muted font-normal">(optional)</span>}
          </label>
          {!hasVideo ? (
            <label className={`flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed py-6 cursor-pointer bg-white ${videoRequired ? 'border-orange' : 'border-border'}`}>
              <Video size={22} className={videoRequired ? 'text-orange' : 'text-muted'} />
              <span className="text-xs font-semibold text-navy font-display">
                {videoRequired ? 'Add a quick video — required' : 'Add a short video'}
              </span>
              <span className="text-[10px] text-muted">Max {MAX_VIDEO_MB}MB, ~30 sec is plenty</span>
              <input type="file" accept="video/*" className="hidden" onChange={handleVideoPick} />
            </label>
          ) : (
            <div className="relative rounded-card overflow-hidden border border-border bg-black">
              <video src={newVideo?.preview || existingVideoUrl} className="w-full max-h-48 object-contain" controls />
              <button type="button" onClick={() => { setNewVideo(null); setExistingVideoUrl(null) }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-navy/80 flex items-center justify-center">
                <X size={14} className="text-white" />
              </button>
            </div>
          )}
          {videoError && <p className="text-xs text-danger mt-1.5">{videoError}</p>}
          <div className="flex items-start gap-2 bg-success-bg rounded-button px-3.5 py-3 mt-2.5">
            <ShieldCheck size={16} className="text-success shrink-0 mt-0.5" />
            <p className="text-[11px] text-navy leading-relaxed">
              <span className="font-semibold">Books with video get a "Verified Condition" badge</span> and sell up to 2x faster.
            </p>
          </div>
        </div>

        <Input label="Book Title" placeholder="e.g. Engineering Mathematics Vol. 2" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Author" placeholder="e.g. B.S. Grewal" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <Input label="Subject" placeholder="e.g. Maths" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-navy mb-2 font-display">Category</label>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button key={cat} type="button" onClick={() => setCategory(cat)}
                className={`text-xs font-semibold font-display px-3.5 py-2 rounded-chip transition-colors ${category === cat ? 'bg-orange text-white' : 'bg-white text-navy border border-border'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-xs font-semibold text-navy mb-2 font-display">Book Condition</label>
          <div className="bg-white rounded-card border border-border p-4">
            <div className="flex justify-between mb-3">
              {[1,2,3,4,5].map((level) => (
                <button key={level} type="button" onClick={() => setCondition(level)}
                  className={`w-9 h-9 rounded-full text-xs font-bold font-display transition-all ${condition === level ? 'bg-orange text-white scale-110' : 'bg-cream text-muted'}`}>
                  {level}
                </button>
              ))}
            </div>
            <p className="text-center text-sm font-semibold text-navy font-display">{CONDITIONS[condition].label}</p>
            <p className="text-center text-[11px] text-muted mt-1">Be honest — mismatched condition leads to disputes</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy mb-1.5 font-display">
            Description <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Any highlighting, missing pages, or notes for the buyer…" rows={3}
            className="w-full bg-white border border-border rounded-button px-4 py-3 text-sm text-navy outline-none focus:border-orange transition-colors placeholder:text-muted/60 resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label="Your Price (₹)" type="number" placeholder="350" value={price} onChange={(e) => setPrice(e.target.value)} required />
          <Input
            label="Original Price (₹)"
            type="number"
            placeholder="680"
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
            error={originalPrice && price && Number(price) >= Number(originalPrice) ? 'Must be higher than selling price' : ''}
          />
        </div>

        {/* Fee breakdown */}
        {price > 0 && (
          <div className="bg-navy/5 rounded-card p-4 flex flex-col gap-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Listing price</span>
              <span className="font-semibold text-navy">₹{price}</span>
            </div>
            <div className="flex justify-between text-xs items-center">
              <span className="text-muted">Platform fee</span>
              <div className="flex items-center gap-2">
                <span className="line-through text-muted/50">₹{platformFee}</span>
                <span className="text-[9px] font-bold text-success bg-success-bg px-2 py-0.5 rounded-chip">Waived during beta 🎉</span>
              </div>
            </div>
            <div className="h-px bg-border my-0.5" />
            <div className="flex justify-between text-sm">
              <span className="font-display font-semibold text-navy">You receive</span>
              <span className="font-display font-bold text-success">₹{price}</span>
            </div>
          </div>
        )}

        {error && <div className="bg-danger-bg text-danger text-xs font-medium rounded-button px-4 py-3">{error}</div>}
      </form>

      <div className="fixed bottom-0 left-0 right-0 bg-cream/95 backdrop-blur border-t border-border px-4 py-4">
        <Button variant="primary" size="lg" className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? (isEditMode ? 'Saving…' : 'Posting…') : (isEditMode ? 'Save Changes' : 'Post Book for Sale')}
        </Button>
      </div>
    </div>
  )
}
