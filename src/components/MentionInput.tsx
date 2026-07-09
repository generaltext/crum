import { useEffect, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import { KINDS, titleField, type EntityKind } from '../lib/model'
import { mentionToken, parseBody } from '../lib/mentions'
import { Icon, type IconName } from './Icon'

interface Match {
  id: string
  title: string
  kind: EntityKind
}

interface Popup {
  items: Match[]
  active: number
  start: number // offset of '@' within the anchor text node
  end: number // caret offset within the anchor text node
  node: Text
  rect: { left: number; top: number }
}

function buildInitialDom(el: HTMLElement, value: string) {
  el.replaceChildren()
  for (const seg of parseBody(value)) {
    if (seg.type === 'mention') {
      el.appendChild(makeChip(seg.id, seg.label))
    } else {
      const lines = seg.text.split('\n')
      lines.forEach((line, i) => {
        if (i > 0) el.appendChild(document.createElement('br'))
        if (line) el.appendChild(document.createTextNode(line))
      })
    }
  }
}

function makeChip(id: string, label: string): HTMLElement {
  const span = document.createElement('span')
  span.className = 'mention'
  span.contentEditable = 'false'
  span.dataset.id = id
  span.dataset.label = label
  span.textContent = label
  return span
}

function serialize(root: HTMLElement): string {
  let out = ''
  const walk = (node: Node) => {
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        out += (child as Text).data
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement
        if (el.classList.contains('mention')) {
          out += mentionToken(el.dataset.id ?? '', el.dataset.label ?? '')
        } else if (el.tagName === 'BR') {
          out += '\n'
        } else {
          if (/^(DIV|P)$/.test(el.tagName) && out && !out.endsWith('\n')) out += '\n'
          walk(el)
        }
      }
    })
  }
  walk(root)
  return out.replace(/\n+$/, '')
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  submitOnEnter = false,
  onSubmit,
  autoFocus = false,
  minHeight = 40,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  submitOnEnter?: boolean
  onSubmit?: () => void
  autoFocus?: boolean
  minHeight?: number
}) {
  const { state } = useStore()
  const ref = useRef<HTMLDivElement>(null)
  const [popup, setPopup] = useState<Popup | null>(null)

  // Seed the DOM once from the incoming value (uncontrolled thereafter; the
  // parent resets by remounting with a new key).
  useEffect(() => {
    if (ref.current) {
      buildInitialDom(ref.current, value)
      if (autoFocus) ref.current.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function search(query: string): Match[] {
    const q = query.trim().toLowerCase()
    return Object.values(state.entities)
      .filter((e) => !e.archived)
      .map((e) => ({ id: e.id, kind: e.kind, title: String(e.fields[titleField(e.kind)] ?? '') }))
      .filter((m) => m.title && (q === '' || m.title.toLowerCase().includes(q)))
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, 6)
  }

  function detectTrigger() {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return setPopup(null)
    const node = sel.anchorNode
    if (!node || node.nodeType !== Node.TEXT_NODE || !ref.current?.contains(node)) return setPopup(null)
    const text = (node as Text).data
    const before = text.slice(0, sel.anchorOffset)
    const m = /(?:^|\s)@([^\s@]*)$/.exec(before)
    if (!m) return setPopup(null)
    const query = m[1] ?? ''
    const items = search(query)
    const range = sel.getRangeAt(0).cloneRange()
    const rect = range.getBoundingClientRect()
    setPopup({
      items,
      active: 0,
      start: sel.anchorOffset - query.length - 1, // the '@'
      end: sel.anchorOffset,
      node: node as Text,
      rect: { left: rect.left, top: rect.bottom },
    })
  }

  function choose(match: Match) {
    if (!popup) return
    const { node, start, end } = popup
    const range = document.createRange()
    range.setStart(node, start)
    range.setEnd(node, end)
    range.deleteContents()
    const chip = makeChip(match.id, match.title)
    range.insertNode(chip)
    const space = document.createTextNode(' ')
    chip.after(space)
    const after = document.createRange()
    after.setStartAfter(space)
    after.collapse(true)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(after)
    setPopup(null)
    if (ref.current) onChange(serialize(ref.current))
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (popup && popup.items.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setPopup({ ...popup, active: (popup.active + 1) % popup.items.length })
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setPopup({ ...popup, active: (popup.active - 1 + popup.items.length) % popup.items.length })
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        choose(popup.items[popup.active]!)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setPopup(null)
        return
      }
    }
    if (submitOnEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit?.()
    }
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={() => {
          if (ref.current) onChange(serialize(ref.current))
          detectTrigger()
        }}
        onKeyUp={detectTrigger}
        onClick={detectTrigger}
        onBlur={() => setTimeout(() => setPopup(null), 150)}
        onKeyDown={onKeyDown}
        className="w-full rounded-md border px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2"
        style={
          {
            minHeight,
            borderColor: 'var(--border)',
            background: 'var(--panel)',
            '--tw-ring-color': 'color-mix(in srgb, var(--accent) 40%, transparent)',
          } as React.CSSProperties
        }
      />
      {popup && (
        <ul
          className="fixed z-50 max-h-64 w-64 overflow-auto rounded-lg border py-1 shadow-lg"
          style={{ left: popup.rect.left, top: popup.rect.top + 4, background: 'var(--panel)', borderColor: 'var(--border)' }}
        >
          {popup.items.length === 0 && (
            <li className="px-3 py-2 text-sm" style={{ color: 'var(--muted)' }}>
              No matches
            </li>
          )}
          {popup.items.map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  choose(m)
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm"
                style={{ background: i === popup.active ? 'var(--hover)' : 'transparent' }}
              >
                <Icon name={KINDS[m.kind].icon as IconName} size={14} style={{ color: 'var(--muted)' }} />
                <span className="truncate">{m.title}</span>
                <span className="ml-auto text-xs" style={{ color: 'var(--muted)' }}>
                  {KINDS[m.kind].singular}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
