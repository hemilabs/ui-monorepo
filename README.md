# UI Monorepo

A comprehensive collection of UI components and utilities for blockchain applications by Hemi Labs.

## 📦 Packages

This monorepo contains the following packages:

- **@hemilabs/btc-wallet**: Components for Bitcoin wallet integration (Currently, only Unisat is supported)
- **@hemilabs/sliding-block-window**: UI components for block visualization and walkthrough of block ranges
- **@hemilabs/webapp**: Portal app living at [https://app.hemi.xyz](https://app.hemi.xyz)

## Deployment

Deploys to staging are triggered when merging changes to the `main` branch.

Deploys to production are triggered when a [release](https://github.com/hemilabs/ui-monorepo/releases/new) is created.
The suggested format for the tags is `YYYYMMDD_seq`.
The release notes could be auto-generated by GitHub after selecting the tag.

Tags applied with the following command will show in its message the list of all the PRs merged since the last tag:

```sh
git tag -s YYYYMMDD_seq -m "Deploy $(date -I)" -m "$(git log $(git describe --abbrev=0 --tags)..HEAD --oneline | grep Merge)"
```
