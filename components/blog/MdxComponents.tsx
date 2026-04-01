import Image from 'next/image'
import Link from 'next/link'
import {
  Children,
  isValidElement,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ImgHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

function toImageDimension(value: string | number | undefined, fallback: number) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : fallback
  }

  return fallback
}

function BlogHeading({
  id,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { id?: string }) {
  if (!id) {
    return (
      <h2 className={className} {...props}>
        {children}
      </h2>
    )
  }

  return (
    <h2 id={id} className={cn('group scroll-mt-24', className)} {...props}>
      <a href={`#${id}`} className="inline-flex items-center gap-2 no-underline">
        {children}
        <span className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          #
        </span>
      </a>
    </h2>
  )
}

function BlogLink({ href = '', className, children, ...props }: ComponentPropsWithoutRef<'a'>) {
  const hrefValue = typeof href === 'string' ? href : ''
  const isExternal = hrefValue.startsWith('http://') || hrefValue.startsWith('https://')

  if (isExternal) {
    return (
      <a
        href={hrefValue}
        target="_blank"
        rel="noreferrer"
        className={cn('text-primary decoration-primary/40 underline underline-offset-4', className)}
        {...props}
      >
        {children}
      </a>
    )
  }

  return (
    <Link
      href={hrefValue}
      className={cn('text-primary decoration-primary/40 underline underline-offset-4', className)}
      {...props}
    >
      {children}
    </Link>
  )
}

function BlogImage({
  src = '',
  alt = '',
  title,
  className,
  width: imageWidth,
  height: imageHeight,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  if (typeof src !== 'string' || !src) {
    return null
  }

  const width = toImageDimension(imageWidth, 1600)
  const height = toImageDimension(imageHeight, 900)

  return (
    <figure className="my-8 overflow-hidden">
      <a href={src} target="_blank" rel="noreferrer" className="block">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          unoptimized
          sizes="(max-width: 1024px) 100vw, 896px"
          loading="lazy"
          className={cn(
            'border-border w-full rounded-2xl border object-cover shadow-sm',
            className,
          )}
          {...props}
        />
      </a>
      {title && (
        <figcaption className="text-muted-foreground mt-3 text-center text-sm">{title}</figcaption>
      )}
    </figure>
  )
}

function isStandaloneImageNode(child: ReactNode) {
  return isValidElement(child) && child.type === BlogImage
}

function BlogParagraph({ className, children, ...props }: ComponentPropsWithoutRef<'p'>) {
  const meaningfulChildren = Children.toArray(children).filter((child) => {
    return !(typeof child === 'string' && child.trim().length === 0)
  })

  if (meaningfulChildren.length > 0 && meaningfulChildren.every(isStandaloneImageNode)) {
    return <div className={className}>{children}</div>
  }

  return (
    <p className={className} {...props}>
      {children}
    </p>
  )
}

function InlineCode({ className, ...props }: ComponentPropsWithoutRef<'code'>) {
  if ('data-language' in props || 'data-theme' in props) {
    return <code className={className} {...props} />
  }

  return (
    <code
      className={cn(
        'bg-muted rounded-md px-1.5 py-0.5 font-mono text-[0.9em] break-words',
        className,
      )}
      {...props}
    />
  )
}

export const blogMdxComponents = {
  h1: ({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className={cn('text-4xl font-semibold tracking-tight', className)} {...props}>
      {children}
    </h1>
  ),
  h2: ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <BlogHeading
      className={cn('mt-12 text-2xl font-semibold tracking-tight', className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
    <BlogHeading
      className={cn('mt-8 text-xl font-semibold tracking-tight', className)}
      {...props}
    />
  ),
  p: BlogParagraph,
  a: BlogLink,
  img: BlogImage,
  pre: ({ className, ...props }: ComponentPropsWithoutRef<'pre'>) => (
    <pre className={className} {...props} />
  ),
  code: InlineCode,
  blockquote: ({ className, ...props }: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote
      className={cn('border-border text-muted-foreground border-l-4 pl-4 italic', className)}
      {...props}
    />
  ),
  table: ({ className, ...props }: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-8 overflow-x-auto">
      <table className={cn('w-full min-w-max border-collapse text-sm', className)} {...props} />
    </div>
  ),
}
