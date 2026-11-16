import { dropIndex, moveItem } from './reorder'

test('moving an item puts it at the new place and keeps the rest in order', () => {
  expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  expect(moveItem(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c'])
  expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b'])
})

test('the lifted item lands past every item whose middle it has crossed', () => {
  const mids = [50, 150, 250, 350]
  expect(dropIndex(mids, 0, 50)).toBe(0)
  expect(dropIndex(mids, 0, 160)).toBe(1)
  expect(dropIndex(mids, 0, 400)).toBe(3)
  expect(dropIndex(mids, 3, 240)).toBe(2)
  expect(dropIndex(mids, 3, 10)).toBe(0)
  expect(dropIndex(mids, 1, 140)).toBe(1)
})
