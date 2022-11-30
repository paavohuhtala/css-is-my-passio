
export function* range(start: number, end: number) {
  for (let i = start; i < end; i++) {
    yield i
  }
}

export function rangeArray(start: number, end: number) {
  return [...range(start, end)]
}

export function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

export function* windows<T>(arr: T[], size: number) {
  for (let i = 0; i < arr.length - size + 1; i++) {
    yield arr.slice(i, i + size)
  }

  yield [arr[arr.length - 1]]
}
