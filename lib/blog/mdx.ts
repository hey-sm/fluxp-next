import { cache } from 'react'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import GithubSlugger from 'github-slugger'
import { toString } from 'mdast-util-to-string'
import { pinyin } from 'pinyin-pro'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

const BLOG_DIR = path.join(process.cwd(), 'content/blog')
const BLOG_HOME_HREF = '/blog'
const ROOT_SECTION_TITLE = 'General'
const CONTENT_FILE_PATTERN = /\.(md|mdx)$/iu
const IGNORED_DIRECTORIES = new Set(['assets'])

export type BlogHeading = {
  id: string
  text: string
  level: 2 | 3
}

export type BlogDocMeta = {
  title: string
  slug: string
  segments: string[]
  href: string
  date: string
  excerpt?: string
  tags?: string[]
}

export type BlogDoc = BlogDocMeta & {
  content: string
  headings: BlogHeading[]
}

export type AdjacentBlogDocs = {
  previous: BlogDocMeta | null
  next: BlogDocMeta | null
}

export type BlogNavItem = {
  title: string
  href: string
  isGroup: boolean
  children: BlogNavItem[]
}

export type BlogHomeSection = {
  title: string
  href: string
  count: number
  items: BlogDocMeta[]
}

export type BlogHomeData = {
  sections: BlogHomeSection[]
  featuredDocs: BlogDocMeta[]
}

type InternalDoc = BlogDoc & {
  sortName: string
  rawSegments: string[]
  rawFileName: string
  fileSlug: string
}

type NavigationTreeNode = {
  title: string
  href?: string
  isGroup: boolean
  sortName: string
  children: Map<string, NavigationTreeNode>
}

function joinBlogHref(segments: string[]) {
  return segments.length === 0 ? BLOG_HOME_HREF : `${BLOG_HOME_HREF}/${segments.join('/')}`
}

function cleanDisplayName(value: string) {
  return value.replace(CONTENT_FILE_PATTERN, '').trim()
}

function stripSortPrefix(value: string) {
  return value.replace(/^\d+[\s._-]*/u, '').trim()
}

function fallbackTitleFromName(value: string) {
  const cleaned = stripSortPrefix(cleanDisplayName(value))
  return cleaned || cleanDisplayName(value) || 'Untitled'
}

function slugifyValue(value: string) {
  const transliterated = pinyin(value, {
    toneType: 'none',
    type: 'array',
    nonZh: 'consecutive',
  })
    .join('-')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')

  const slug = transliterated
    .toLowerCase()
    .replace(/['’"]/gu, '')
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'document'
}

function naturalSegmentCompare(a: string, b: string) {
  return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' })
}

function compareBySortName(
  a: { sortName: string; title: string },
  b: { sortName: string; title: string },
) {
  const numericPrefixA = /^(\d+)/u.exec(a.sortName)
  const numericPrefixB = /^(\d+)/u.exec(b.sortName)

  if (numericPrefixA && numericPrefixB) {
    const difference = Number(numericPrefixA[1]) - Number(numericPrefixB[1])
    if (difference !== 0) return difference
  } else if (numericPrefixA) {
    return -1
  } else if (numericPrefixB) {
    return 1
  }

  const strippedDifference = naturalSegmentCompare(
    stripSortPrefix(a.sortName),
    stripSortPrefix(b.sortName),
  )
  if (strippedDifference !== 0) return strippedDifference

  return naturalSegmentCompare(a.title, b.title)
}

function compareMetaByTitle(a: BlogDocMeta, b: BlogDocMeta) {
  return naturalSegmentCompare(a.title, b.title)
}

function compareSectionsByTitle(a: BlogHomeSection, b: BlogHomeSection) {
  return naturalSegmentCompare(a.title, b.title)
}

function listContentFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return []

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) {
        return []
      }

      return listContentFiles(entryPath)
    }

    if (CONTENT_FILE_PATTERN.test(entry.name)) {
      return [entryPath]
    }

    return []
  })
}

function extractHeadings(content: string): BlogHeading[] {
  const tree = unified().use(remarkParse).use(remarkMdx).parse(content)
  const slugger = new GithubSlugger()
  const headings: BlogHeading[] = []

  visit(tree, 'heading', (node) => {
    if (node.depth !== 2 && node.depth !== 3) {
      return
    }

    const text = toString(node).trim()
    if (!text) {
      return
    }

    headings.push({
      id: slugger.slug(text),
      text,
      level: node.depth,
    })
  })

  return headings
}

function readBlogFile(filePath: string): InternalDoc {
  const rawFile = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(rawFile)
  const relativePath = path.relative(BLOG_DIR, filePath)
  const relativeSegments = relativePath.split(path.sep)
  const fileName = relativeSegments.at(-1) ?? ''
  const fileStem = cleanDisplayName(fileName)
  const directorySegments = relativeSegments.slice(0, -1)
  const fileSlug = slugifyValue(fileStem)
  const slug = slugifyValue(String(data.slug ?? fileStem))
  const segments = [...directorySegments.map(slugifyValue), slug]
  const href = joinBlogHref(segments)

  return {
    title: String(data.title ?? fallbackTitleFromName(fileStem)),
    slug,
    segments,
    href,
    date: data.date ? String(data.date) : '',
    excerpt: typeof data.excerpt === 'string' ? data.excerpt : undefined,
    tags: Array.isArray(data.tags)
      ? data.tags.filter((tag): tag is string => typeof tag === 'string')
      : undefined,
    content,
    headings: extractHeadings(content),
    sortName: fileStem,
    rawSegments: [...directorySegments, fileStem],
    rawFileName: fileStem,
    fileSlug,
  }
}

function buildNavigationTree(docs: InternalDoc[]) {
  const root = new Map<string, NavigationTreeNode>()

  for (const doc of docs) {
    let cursor = root

    doc.segments.slice(0, -1).forEach((segment, index) => {
      const existing = cursor.get(segment)

      if (existing) {
        cursor = existing.children
        return
      }

      const node: NavigationTreeNode = {
        title: fallbackTitleFromName(doc.rawSegments[index]),
        href: joinBlogHref(doc.segments.slice(0, index + 1)),
        isGroup: true,
        sortName: doc.rawSegments[index],
        children: new Map(),
      }

      cursor.set(segment, node)
      cursor = node.children
    })

    const leafKey = doc.segments.at(-1) ?? doc.slug
    cursor.set(leafKey, {
      title: doc.title,
      href: doc.href,
      isGroup: false,
      sortName: doc.rawFileName,
      children: new Map(),
    })
  }

  function serialize(nodes: Map<string, NavigationTreeNode>): BlogNavItem[] {
    return [...nodes.values()]
      .sort((a, b) => {
        if (a.isGroup !== b.isGroup) {
          return a.isGroup ? 1 : -1
        }

        return compareBySortName(a, b)
      })
      .map((node) => ({
        title: node.title,
        href: node.href ?? BLOG_HOME_HREF,
        isGroup: node.isGroup,
        children: serialize(node.children),
      }))
  }

  return serialize(root)
}

const getBlogIndex = cache(() => {
  const docs = listContentFiles(BLOG_DIR)
    .map(readBlogFile)
    .sort((a, b) => {
      if (a.segments.length !== b.segments.length) {
        return a.segments.length - b.segments.length
      }

      return compareBySortName(a, b)
    })
  const seenSegmentKeys = new Map<string, number>()

  for (const doc of docs) {
    const preferredKey = doc.segments.join('/')
    const seenCount = seenSegmentKeys.get(preferredKey) ?? 0

    if (seenCount === 0) {
      seenSegmentKeys.set(preferredKey, 1)
      continue
    }

    const baseSegments = [...doc.segments.slice(0, -1), doc.fileSlug]
    let candidateSegments = baseSegments
    let suffix = 2

    while (seenSegmentKeys.has(candidateSegments.join('/'))) {
      candidateSegments = [...baseSegments.slice(0, -1), `${doc.fileSlug}-${suffix}`]
      suffix += 1
    }

    doc.slug = candidateSegments.at(-1) ?? doc.slug
    doc.segments = candidateSegments
    doc.href = joinBlogHref(candidateSegments)
    seenSegmentKeys.set(candidateSegments.join('/'), 1)
  }

  const docsByHref = new Map(docs.map((doc) => [doc.href, doc]))
  const docsBySegments = new Map(docs.map((doc) => [doc.segments.join('/'), doc]))

  return {
    docs,
    docsByHref,
    docsBySegments,
    navigation: buildNavigationTree(docs),
  }
})

export function getBlogNavigation(): BlogNavItem[] {
  return getBlogIndex().navigation
}

export function getBlogStaticParams() {
  return getBlogIndex().docs.map((doc) => ({
    segments: doc.segments,
  }))
}

export function getBlogDocBySegments(segments: string[]): BlogDoc | null {
  const key = segments.join('/')
  return getBlogIndex().docsBySegments.get(key) ?? null
}

export function getAdjacentBlogDocs(segments: string[]): AdjacentBlogDocs {
  const docs = getBlogIndex().docs
  const key = segments.join('/')
  const currentIndex = docs.findIndex((doc) => doc.segments.join('/') === key)

  if (currentIndex === -1) {
    return {
      previous: null,
      next: null,
    }
  }

  return {
    previous: docs[currentIndex - 1] ?? null,
    next: docs[currentIndex + 1] ?? null,
  }
}

export function getBlogHeadings(segments: string[]) {
  return getBlogDocBySegments(segments)?.headings ?? []
}

export function getBlogHomeData(): BlogHomeData {
  const docs = getBlogIndex().docs
  const sectionsMap = new Map<string, BlogHomeSection>()

  for (const doc of docs) {
    const sectionKey =
      doc.rawSegments[0] === doc.rawFileName ? ROOT_SECTION_TITLE : doc.rawSegments[0]
    const existing = sectionsMap.get(sectionKey)

    if (existing) {
      existing.count += 1
      existing.items.push(doc)
      continue
    }

    sectionsMap.set(sectionKey, {
      title: fallbackTitleFromName(sectionKey),
      href: doc.href,
      count: 1,
      items: [doc],
    })
  }

  const sections = [...sectionsMap.values()]
    .map((section) =>
      Object.assign({}, section, {
        items: [...section.items].sort(compareMetaByTitle),
      }),
    )
    .sort(compareSectionsByTitle)

  return {
    sections,
    featuredDocs: docs.slice(0, 6),
  }
}
