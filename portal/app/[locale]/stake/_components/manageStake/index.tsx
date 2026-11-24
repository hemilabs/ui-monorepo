import { Drawer } from 'components/drawer'
import { type StakeToken } from 'types/stake'
import { useTranslations } from 'use-intl'

import { UnstakeOperation } from './unstakeOperation'

type Props = {
  closeDrawer: VoidFunction
  token: StakeToken
}

export const ManageStake = function ({ closeDrawer, token }: Props) {
  const t = useTranslations('stake-page.drawer')

  return (
    <Drawer onClose={closeDrawer}>
      <UnstakeOperation
        closeDrawer={closeDrawer}
        heading={t('manage-your-stake')}
        subheading={t('description-manage-stake')}
        token={token}
      />
    </Drawer>
  )
}
