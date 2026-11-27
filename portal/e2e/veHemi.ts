import { hemi } from 'hemi-viem'
import { getVeHemiContractAddress } from 've-hemi-actions'
import { parseAbi } from 'viem'

export const veHemiAbi = parseAbi([
  'error ERC721NonexistentToken(uint256 tokenId)',
  'event Lock(address indexed provider, address indexed account, uint256 indexed tokenId, uint256 value, uint256 ts, uint256 lockDuration, uint256 type, bool transferable, bool forfeitable)',
  'function balanceOf(address owner) view returns (uint256)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
])

export const veHemiAddress = getVeHemiContractAddress(hemi.id)
