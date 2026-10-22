import _ from "lodash";

export function orderByRoomOrder<T extends { id: string }>(
  rooms: T[],
  roomOrder: string[],
): T[] {
  const byId = _.keyBy(rooms, "id");
  const ordered = _.compact(roomOrder.map((id) => byId[id]));
  return [...ordered, ..._.differenceBy(rooms, ordered, "id")];
}

export function moveInOrder(
  order: string[],
  index: number,
  offset: -1 | 1,
): string[] {
  const target = index + offset;
  if (!_.inRange(index, order.length) || !_.inRange(target, order.length)) {
    return order;
  }
  const next = [...order];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
