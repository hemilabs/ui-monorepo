/**
 * Whether the connected wallet currently holds the position.
 *
 * The positions query matches on `pastOwners` as well as `owner`, because rewards are
 * owed to whoever held a position at the time. Those rows are right to show and wrong to
 * act on - veHEMI only lets the current owner unlock, add to or extend a position.
 */
export const isPositionOwner = ({
  address,
  owner,
}: {
  address?: string
  owner: string
}) => address !== undefined && address.toLowerCase() === owner.toLowerCase()
