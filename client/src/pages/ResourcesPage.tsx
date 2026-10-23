import React, { useState } from 'react'
import { 
  Library, 
  Plus, 
  Search, 
  Star, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  Tag
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { ResourceItem, ResourceType } from '../types'

export const ResourcesPage: React.FC = () => {
  const { 
    subjects, 
    resources, 
    addResource, 
    updateResource, 
    deleteResource, 
    toggleFavoriteResource 
  } = useApp()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all')
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false)

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRes, setEditingRes] = useState<ResourceItem | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '')
  const [type, setType] = useState<ResourceType>('Documentation')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [isVerifiedLink, setIsVerifiedLink] = useState(true)
  const [error, setError] = useState('')

  const openAddModal = () => {
    setEditingRes(null)
    setTitle('')
    setSubjectId(subjects[0]?.id || '')
    setType('Documentation')
    setUrl('')
    setDescription('')
    setTagsInput('')
    setIsVerifiedLink(true)
    setError('')
    setIsModalOpen(true)
  }

  const openEditModal = (res: ResourceItem) => {
    setEditingRes(res)
    setTitle(res.title)
    setSubjectId(res.subjectId)
    setType(res.type)
    setUrl(res.url)
    setDescription(res.description)
    setTagsInput(res.tags.join(', '))
    setIsVerifiedLink(res.isVerifiedLink)
    setError('')
    setIsModalOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !url.trim()) {
      setError('Title and URL are required')
      return
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)

    if (editingRes) {
      updateResource(editingRes.id, {
        title: title.trim(),
        subjectId,
        type,
        url: url.trim(),
        description: description.trim(),
        tags,
        isVerifiedLink
      })
    } else {
      addResource({
        title: title.trim(),
        subjectId,
        type,
        url: url.trim(),
        description: description.trim(),
        tags,
        isFavorite: false,
        isVerifiedLink
      })
    }

    setIsModalOpen(false)
  }

  // Filtered resources
  const filteredResources = resources.filter(res => {
    if (favoritesOnly && !res.isFavorite) return false
    if (selectedSubjectFilter !== 'all' && res.subjectId !== selectedSubjectFilter) return false
    if (selectedTypeFilter !== 'all' && res.type !== selectedTypeFilter) return false

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      const matchTitle = res.title.toLowerCase().includes(q)
      const matchDesc = res.description.toLowerCase().includes(q)
      const matchTags = res.tags.some(t => t.toLowerCase().includes(q))
      if (!matchTitle && !matchDesc && !matchTags) return false
    }

    return true
  })

  const resourceTypes: ResourceType[] = [
    'Textbook',
    'Research Paper',
    'Documentation',
    'Guide',
    'Practice Platform',
    'Standard',
    'Whitepaper',
    'Open Textbook',
    'Other'
  ]

  return (
    <div className="space-y-6 pb-16">
      {/* Header and Add Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Academic Resource Library</h2>
          <p className="text-xs text-slate-400">Curated syllabus references, documentation, whitepapers, and study platforms</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors self-start md:self-auto focus-ring"
        >
          <Plus className="w-4 h-4" />
          <span>Add Resource</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by title, tag, topic..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#111827] border border-[#1f293d] text-xs text-slate-200 placeholder-slate-500 focus-ring"
          />
        </div>

        {/* Subject Filter */}
        <div>
          <select
            value={selectedSubjectFilter}
            onChange={e => setSelectedSubjectFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-[#1f293d] text-xs text-slate-200 focus-ring"
          >
            <option value="all">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div>
          <select
            value={selectedTypeFilter}
            onChange={e => setSelectedTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#111827] border border-[#1f293d] text-xs text-slate-200 focus-ring"
          >
            <option value="all">All Resource Types</option>
            {resourceTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Favorites Toggle */}
        <button
          type="button"
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 border transition-colors focus-ring ${
            favoritesOnly
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              : 'bg-[#111827] border-[#1f293d] text-slate-400 hover:text-slate-200'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${favoritesOnly ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>Favorites Only ({resources.filter(r => r.isFavorite).length})</span>
        </button>
      </div>

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredResources.length === 0 ? (
          <div className="col-span-full p-12 rounded-xl bg-[#111827] border border-[#1e293d] text-center text-slate-400 text-xs">
            <Library className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="font-medium text-slate-300">No resources matched your criteria.</p>
            <p className="mt-1">Clear filters or add a new bookmark.</p>
          </div>
        ) : (
          filteredResources.map(res => {
            const sub = subjects.find(s => s.id === res.subjectId)
            return (
              <div
                key={res.id}
                className="p-5 rounded-xl bg-[#111827] border border-[#1e293d] hover:border-[#2a3952] transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-semibold text-blue-400 bg-[#172238] px-2 py-0.5 rounded border border-[#233352]">
                        {sub?.code || 'General'}
                      </span>
                      <span className="text-[10px] text-slate-300 bg-[#162035] px-2 py-0.5 rounded border border-[#212d45]">
                        {res.type}
                      </span>
                      {res.isVerifiedLink ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified Link
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Unverified
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleFavoriteResource(res.id)}
                        className="p-1 rounded text-slate-400 hover:text-amber-400 transition-colors focus-ring"
                        aria-label="Toggle favorite"
                      >
                        <Star className={`w-4 h-4 ${res.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                      </button>
                      <button
                        onClick={() => openEditModal(res)}
                        className="p-1 rounded text-slate-400 hover:text-white transition-colors focus-ring"
                        title="Edit resource"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteResource(res.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400 transition-colors focus-ring"
                        title="Delete resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-white leading-snug">
                    {res.title}
                  </h3>

                  {res.description && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {res.description}
                    </p>
                  )}

                  {/* Tags */}
                  {res.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {res.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] text-slate-400 bg-[#0c121e] border border-[#1b2538] px-2 py-0.5 rounded-md flex items-center gap-1"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-500" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#1f293d] flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 truncate max-w-[200px] font-mono">
                    {res.url.replace(/^https?:\/\//, '')}
                  </span>

                  <a
                    href={res.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#162035] hover:bg-[#202d4a] text-slate-200 border border-[#233352] text-xs font-medium flex items-center gap-1.5 transition-colors focus-ring"
                  >
                    <span>Open Resource</span>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  </a>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add / Edit Resource Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#111827] border border-[#23314e] rounded-xl shadow-2xl p-5 space-y-4">
            <h3 className="text-base font-semibold text-white">
              {editingRes ? 'Edit Resource' : 'Add Academic Resource'}
            </h3>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Algorithms (CLRS)"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={e => setSubjectId(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as ResourceType)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring"
                  >
                    {resourceTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Resource URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Summary of chapters, key concepts, or why this link matters..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="Graphs, SCC, LeetCode, Cheatsheet"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#0b0f19] border border-[#23314e] text-xs text-slate-200 focus-ring"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="verifiedCheck"
                  checked={isVerifiedLink}
                  onChange={e => setIsVerifiedLink(e.target.checked)}
                  className="rounded bg-[#0b0f19] border-[#23314e] text-blue-600 focus-ring"
                />
                <label htmlFor="verifiedCheck" className="text-xs text-slate-300 cursor-pointer">
                  Mark as verified working academic link
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  {editingRes ? 'Save Changes' : 'Add Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
