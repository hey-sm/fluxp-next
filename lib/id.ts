import { nanoid } from 'nanoid'

type CreateIdOptions = {
  prefix?: string
  size?: number
}

export function createId(options: CreateIdOptions = {}) {
  const { prefix, size = 21 } = options
  const id = nanoid(size)

  return prefix ? `${prefix}_${id}` : id
}
