import { ProgressStatus } from 'components/reviewOperation/progressStatus'

export const showsReview = ({
  canRetry,
  hasSigned,
}: {
  canRetry: boolean
  hasSigned: boolean
}) => !hasSigned || canRetry

export const unsignedStepStatus = (mayNeedApproval: boolean) =>
  mayNeedApproval ? ProgressStatus.NOT_READY : ProgressStatus.READY

export const resolveMayNeedApproval = ({
  isAllowanceError,
  isAllowanceLoading,
  needsApproval,
}: {
  isAllowanceError: boolean
  isAllowanceLoading: boolean
  needsApproval: boolean
}) => needsApproval || isAllowanceLoading || isAllowanceError
