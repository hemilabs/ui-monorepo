# Webapp

## Project setup

### Environment variables

The environment variables are defined in the `.env` file at the root of the project.
The prefix `NEXT_PUBLIC_` is required for the variables to be available in the browser.

#### NEXT_PUBLIC_RAINBOW_APP_NAME

The name of the application. It is used to display the name of the application in the dialog opened by the Rainbow.

#### NEXT_PUBLIC_RAINBOW_PROJECT_ID

A Rainbow project ID. You can obtain it from [https://cloud.walletconnect.com/]

#### NEXT_PUBLIC_CHAIN_ID

Integer representing the ID of the blockchain. E.g.: 11155222

#### NEXT_PUBLIC_CHAIN_NAME

The name of the blockchain. E.g.: BVM

#### NEXT_PUBLIC_CHAIN_NETWORK

The network of the blockchain. E.g.: sepolia

#### NEXT_PUBLIC_CHAIN_RPC_URL

The RPC URL of the blockchain. E.g.: [https://external-testnet.bvmdev.cc:18546]
If the address is no a secure address (https), the application will not work.

#### NEXT_PUBLIC_CHAIN_EXPLORER_NAME

The name of the blockchain explorer. E.g.: BVM Explorer

#### NEXT_PUBLIC_CHAIN_EXPLORER_URL

The URL of the blockchain explorer. E.g.: [https://external-testnet.bvmdev.cc]
If the address is no a secure address (https), the application will not work.

#### NEXT_PUBLIC_CHAIN_CURRENCY_NAME

The name of the currency of the blockchain. E.g.: BVM

#### NEXT_PUBLIC_CHAIN_CURRENCY_SYMBOL

The symbol of the currency of the blockchain. E.g.: sepETH

#### NEXT_PUBLIC_CHAIN_CURRENCY_DECIMALS

The number of decimals of the currency of the blockchain. E.g.: 18
