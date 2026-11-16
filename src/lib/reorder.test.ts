import { moveItem } from './reorder'

test('moving an item puts it at the new place and keeps the rest in order', () => {
  expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  expect(moveItem(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c'])
  expect(moveItem(['a', 'b'], 1, 1)).toEqual(['a', 'b'])
})
