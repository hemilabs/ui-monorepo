import {
  isRestrictedLocationMeta,
  restrictedLocationMetaName,
} from 'utils/restrictions'

let restricted: boolean | undefined

export const isRestrictedLocation = function () {
  restricted ??= isRestrictedLocationMeta(
    document
      .querySelector(`meta[name="${restrictedLocationMetaName}"]`)
      ?.getAttribute('content'),
  )
  return restricted
}
