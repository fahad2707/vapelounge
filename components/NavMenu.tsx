'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { NavMenuCategoryColumn, NavMenuHeaderPage } from '@/lib/server/nav-menu'
import { navFilterFromSlugs, shopNavHref } from '@/lib/catalog/nav-shop'
import type { ShopNavFilter } from '@/lib/catalog/shop-utils'

const STATIC_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#shop', label: 'Shop' },
  { href: '#testi', label: 'Reviews' },
]

function goToShop(filter: ShopNavFilter | null) {
  window.dispatchEvent(new CustomEvent('vp:filter-nav', { detail: filter }))
  document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })
}

function applyNav(
  e: React.MouseEvent,
  menu: NavMenuHeaderPage[],
  page: NavMenuHeaderPage,
  cat?: NavMenuCategoryColumn,
  modelSlug?: string,
  modelId?: string,
  label?: string,
) {
  e.preventDefault()
  const filter: ShopNavFilter = modelId
    ? {
        categoryId: cat!.id,
        modelId,
        headerPageId: page.id,
        categoryIds: page.categories.map(c => c.id),
        label: label || cat!.name,
      }
    : cat
      ? {
          categoryId: cat.id,
          headerPageId: page.id,
          categoryIds: page.categories.map(c => c.id),
          label: cat.name,
        }
      : {
          headerPageId: page.id,
          categoryIds: page.categories.map(c => c.id),
          label: page.name,
        }

  window.history.replaceState(
    null,
    '',
    shopNavHref(page.slug, cat?.slug, modelSlug),
  )
  goToShop(filter)
}

export default function NavMenu({ onNavigate }: { onNavigate?: () => void }) {
  const [pages, setPages] = useState<NavMenuHeaderPage[]>([])
  const [openPage, setOpenPage] = useState<string | null>(null)
  const [openCat, setOpenCat] = useState<string | null>(null)
  const [openBrand, setOpenBrand] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch('/api/nav/menu')
        if (!r.ok) return
        const j = (await r.json()) as { pages?: NavMenuHeaderPage[] }
        if (!cancelled && j.pages?.length) setPages(j.pages)
      } catch {
        /* static links only */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpenPage(null)
        setOpenCat(null)
        setOpenBrand(null)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    const applyHash = () => {
      const raw = window.location.hash.replace(/^#/, '')
      const qIdx = raw.indexOf('?')
      if (qIdx === -1 || raw.slice(0, qIdx) !== 'shop') return
      const params = new URLSearchParams(raw.slice(qIdx + 1))
      const page = params.get('page') || undefined
      const cat = params.get('cat') || undefined
      const model = params.get('model') || undefined
      if (!pages.length) return
      const filter = navFilterFromSlugs(pages, page, cat, model)
      if (filter) goToShop(filter)
    }
    applyHash()
    window.addEventListener('hashchange', applyHash)
    return () => window.removeEventListener('hashchange', applyHash)
  }, [pages])

  const close = useCallback(() => {
    setOpenPage(null)
    setOpenCat(null)
    setOpenBrand(null)
    onNavigate?.()
  }, [onNavigate])

  return (
    <>
      <div ref={wrapRef} className="nav-menu-desktop">
        {pages.map(page => (
          <div
            key={page.id}
            className="nav-menu-item"
            onMouseEnter={() => {
              setOpenPage(page.id)
              setOpenCat(null)
              setOpenBrand(null)
            }}
            onMouseLeave={() => {
              setOpenPage(prev => (prev === page.id ? null : prev))
              setOpenCat(null)
              setOpenBrand(null)
            }}
          >
            <button
              type="button"
              className={`nav-menu-trigger${openPage === page.id ? ' is-open' : ''}`}
              aria-expanded={openPage === page.id}
              onClick={() => setOpenPage(prev => (prev === page.id ? null : page.id))}
            >
              {page.name}
              <span className="nav-menu-chev" aria-hidden>
                ▾
              </span>
            </button>

            {openPage === page.id && (
              <div className="nav-mega">
                <div className="nav-mega-col">
                  {page.categories.map(cat => {
                    const catKey = `${page.id}:${cat.id}`
                    const hasFlyout = cat.entries.length > 0
                    return (
                      <div
                        key={cat.id}
                        className="nav-mega-brand"
                        onMouseEnter={() => {
                          if (hasFlyout) setOpenCat(catKey)
                        }}
                        onMouseLeave={() => setOpenCat(prev => (prev === catKey ? null : prev))}
                      >
                        <a
                          href={shopNavHref(page.slug, cat.slug)}
                          className="nav-mega-brand-label nav-mega-link"
                          onClick={e => {
                            applyNav(e, pages, page, cat)
                            close()
                          }}
                        >
                          {cat.name}
                          {hasFlyout && <span className="nav-menu-chev nav-menu-chev--right">›</span>}
                        </a>

                        {hasFlyout && openCat === catKey && (
                          <div className="nav-mega-flyout">
                            {cat.entries.map(entry => {
                              if (entry.type === 'item') {
                                return (
                                  <a
                                    key={entry.id}
                                    href={shopNavHref(page.slug, cat.slug, entry.slug)}
                                    className="nav-mega-link"
                                    onClick={e => {
                                      applyNav(e, pages, page, cat, entry.slug, entry.id, entry.name)
                                      close()
                                    }}
                                  >
                                    {entry.name}
                                  </a>
                                )
                              }
                              const brandKey = `${catKey}:${entry.name}`
                              return (
                                <div
                                  key={brandKey}
                                  className="nav-mega-brand"
                                  onMouseEnter={() => setOpenBrand(brandKey)}
                                  onMouseLeave={() =>
                                    setOpenBrand(prev => (prev === brandKey ? null : prev))
                                  }
                                >
                                  <span className="nav-mega-brand-label">
                                    {entry.name}
                                    <span className="nav-menu-chev nav-menu-chev--right">›</span>
                                  </span>
                                  {openBrand === brandKey && (
                                    <div className="nav-mega-flyout nav-mega-flyout--nested">
                                      {entry.models.map(m => (
                                        <a
                                          key={m.id}
                                          href={shopNavHref(page.slug, cat.slug, m.slug)}
                                          className="nav-mega-link"
                                          onClick={e => {
                                            applyNav(e, pages, page, cat, m.slug, m.id, m.name)
                                            close()
                                          }}
                                        >
                                          {m.name}
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <a
                  href={shopNavHref(page.slug)}
                  className="nav-mega-all"
                  onClick={e => {
                    applyNav(e, pages, page)
                    close()
                  }}
                >
                  View all {page.name} →
                </a>
              </div>
            )}
          </div>
        ))}

        {STATIC_LINKS.map(l => (
          <a key={l.href} href={l.href} className="nav-menu-static">
            {l.label}
          </a>
        ))}
      </div>

      <div className="nav-menu-mobile">
        {pages.map(page => (
          <details key={page.id} className="nav-mob-cat">
            <summary>{page.name}</summary>
            <div className="nav-mob-inner">
              {page.categories.map(cat => (
                <details key={cat.id} className="nav-mob-brand">
                  <summary>{cat.name}</summary>
                  <div className="nav-mob-inner">
                    {cat.entries.length === 0 ? (
                      <a
                        href={shopNavHref(page.slug, cat.slug)}
                        onClick={e => {
                          applyNav(e, pages, page, cat)
                          close()
                        }}
                      >
                        All {cat.name}
                      </a>
                    ) : (
                      cat.entries.map(entry => {
                        if (entry.type === 'item') {
                          return (
                            <a
                              key={entry.id}
                              href={shopNavHref(page.slug, cat.slug, entry.slug)}
                              onClick={e => {
                                applyNav(e, pages, page, cat, entry.slug, entry.id, entry.name)
                                close()
                              }}
                            >
                              {entry.name}
                            </a>
                          )
                        }
                        return (
                          <details key={entry.name} className="nav-mob-brand">
                            <summary>{entry.name}</summary>
                            <div className="nav-mob-inner">
                              {entry.models.map(m => (
                                <a
                                  key={m.id}
                                  href={shopNavHref(page.slug, cat.slug, m.slug)}
                                  onClick={e => {
                                    applyNav(e, pages, page, cat, m.slug, m.id, m.name)
                                    close()
                                  }}
                                >
                                  {m.name}
                                </a>
                              ))}
                            </div>
                          </details>
                        )
                      })
                    )}
                  </div>
                </details>
              ))}
              <a
                href={shopNavHref(page.slug)}
                className="nav-mob-all"
                onClick={e => {
                  applyNav(e, pages, page)
                  close()
                }}
              >
                All {page.name}
              </a>
            </div>
          </details>
        ))}
        {STATIC_LINKS.map(l => (
          <a key={l.href} href={l.href} className="nav-mob-static" onClick={close}>
            {l.label}
          </a>
        ))}
      </div>

      <style>{`
        .nav-menu-desktop {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          justify-content: center;
          min-width: 0;
        }
        .nav-menu-mobile { display: none; }
        .nav-menu-item { position: relative; }
        .nav-menu-trigger,
        .nav-menu-static {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(246, 242, 234, 0.72);
          background: none;
          border: none;
          padding: 10px 10px;
          cursor: pointer;
          font-family: inherit;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: color 0.25s;
          white-space: nowrap;
        }
        .nav-menu-static { text-decoration: none; }
        .nav-menu-trigger:hover,
        .nav-menu-trigger.is-open,
        .nav-menu-static:hover { color: var(--gold); }
        .nav-menu-chev { font-size: 8px; opacity: 0.7; }
        .nav-menu-chev--right { font-size: 11px; margin-left: auto; }
        .nav-mega {
          position: absolute;
          top: 100%;
          left: 0;
          min-width: 240px;
          background: #f6f2ea;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.35);
          z-index: 800;
          padding: 8px 0;
        }
        .nav-mega-col { max-height: min(70vh, 460px); overflow-y: auto; }
        .nav-mega-link,
        .nav-mega-brand-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          font-size: 12px;
          font-weight: 500;
          color: #111;
          text-decoration: none;
          transition: background 0.15s;
        }
        .nav-mega-link:hover,
        .nav-mega-brand:hover > .nav-mega-brand-label {
          background: rgba(0, 0, 0, 0.06);
        }
        .nav-mega-brand { position: relative; }
        .nav-mega-flyout {
          position: absolute;
          left: 100%;
          top: 0;
          min-width: 200px;
          background: #f6f2ea;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 8px 12px 32px rgba(0, 0, 0, 0.2);
          padding: 8px 0;
          z-index: 810;
        }
        .nav-mega-flyout--nested { z-index: 820; }
        .nav-mega-all {
          display: block;
          padding: 10px 18px;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #666;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          text-decoration: none;
        }
        .nav-mega-all:hover { color: #111; background: rgba(0, 0, 0, 0.04); }
        @media (max-width: 1100px) {
          .nav-menu-trigger, .nav-menu-static { padding: 8px 6px; font-size: 9px; }
        }
        @media (max-width: 768px) {
          .nav-menu-desktop { display: none; }
          .nav-menu-mobile { display: block; width: 100%; }
          .nav-mob-cat, .nav-mob-brand { border-bottom: 1px solid var(--line); }
          .nav-mob-cat > summary, .nav-mob-brand > summary {
            padding: 14px 0;
            font-size: 18px;
            font-family: var(--serif);
            color: var(--cream);
            cursor: pointer;
            list-style: none;
          }
          .nav-mob-cat > summary::-webkit-details-marker,
          .nav-mob-brand > summary::-webkit-details-marker { display: none; }
          .nav-mob-inner {
            padding: 0 0 12px 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .nav-mob-inner a, .nav-mob-all, .nav-mob-static {
            font-size: 14px;
            color: rgba(246, 242, 234, 0.75);
            text-decoration: none;
          }
          .nav-mob-inner a:hover, .nav-mob-all:hover, .nav-mob-static:hover { color: var(--gold); }
          .nav-mob-brand > summary { font-size: 15px; padding: 10px 0; }
          .nav-mob-static {
            display: block;
            padding: 14px 0;
            font-size: 20px;
            font-family: var(--serif);
          }
        }
      `}</style>
    </>
  )
}
