export const isForecastUnavailable = ({
  hasForecast,
  isError,
  isLoading,
  needsWallet,
}: {
  hasForecast: boolean
  isError: boolean
  isLoading: boolean
  needsWallet: boolean
}) => isError || (!isLoading && (needsWallet || !hasForecast))
