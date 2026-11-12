import { Button, ButtonIcon, ButtonLink } from 'components/button'
import { NuqsTestingAdapter } from 'nuqs/adapters/testing'
import { type ReactNode } from 'react'
import { MemoryRouter } from 'react-router'
import { IntlProvider } from 'use-intl'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

const Providers = ({ children }: { children: ReactNode }) => (
  <IntlProvider locale="en" messages={{}}>
    <MemoryRouter>
      <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
    </MemoryRouter>
  </IntlProvider>
)

describe('Button', function () {
  it('calls onClick when clicked', async function () {
    const onClick = vi.fn()
    const screen = await render(
      <Button onClick={onClick} type="button">
        Submit
      </Button>,
    )

    await screen.getByRole('button', { name: 'Submit' }).click()

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('submits its form when its type is submit', async function () {
    const onSubmit = vi.fn(e => e.preventDefault())
    const screen = await render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Submit</Button>
      </form>,
    )

    await screen.getByRole('button', { name: 'Submit' }).click()

    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async function () {
    const onClick = vi.fn()
    const screen = await render(
      <Button disabled onClick={onClick} type="button">
        Submit
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Submit' })

    await expect.element(button).toBeDisabled()
    await button.click({ force: true })

    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('ButtonIcon', function () {
  it('is named by aria-label and calls onClick when clicked', async function () {
    const onClick = vi.fn()
    const screen = await render(
      <ButtonIcon aria-label="Copy" onClick={onClick} type="button">
        <svg />
      </ButtonIcon>,
    )

    await screen.getByRole('button', { name: 'Copy' }).click()

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async function () {
    const onClick = vi.fn()
    const screen = await render(
      <ButtonIcon aria-label="Copy" disabled onClick={onClick} type="button">
        <svg />
      </ButtonIcon>,
    )
    const button = screen.getByRole('button', { name: 'Copy' })

    await expect.element(button).toBeDisabled()
    await button.click({ force: true })

    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('ButtonLink', function () {
  it('renders an internal link with the locale for a relative URL', async function () {
    const screen = await render(
      <ButtonLink href="/tunnel">Tunnel</ButtonLink>,
      {
        wrapper: Providers,
      },
    )
    const link = screen.getByRole('link', { name: 'Tunnel' })

    await expect.element(link).toHaveAttribute('href', '/en/tunnel')
    await expect.element(link).not.toHaveAttribute('target')
  })

  it('renders an internal link with the locale for a URL object', async function () {
    const screen = await render(
      <ButtonLink href={{ pathname: '/tunnel', query: { operation: 'claim' } }}>
        Tunnel
      </ButtonLink>,
      { wrapper: Providers },
    )

    await expect
      .element(screen.getByRole('link', { name: 'Tunnel' }))
      .toHaveAttribute('href', '/en/tunnel?operation=claim')
  })

  it('renders an external link that opens in a new tab for an absolute URL', async function () {
    const screen = await render(
      <ButtonLink href="https://hemi.xyz">Hemi</ButtonLink>,
    )
    const link = screen.getByRole('link', { name: 'Hemi' })

    await expect.element(link).toHaveAttribute('href', 'https://hemi.xyz')
    await expect.element(link).toHaveAttribute('target', '_blank')
    await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('calls onClick when an internal link is clicked', async function () {
    const onClick = vi.fn()
    const screen = await render(
      <ButtonLink href="/tunnel" onClick={onClick}>
        Tunnel
      </ButtonLink>,
      { wrapper: Providers },
    )

    await screen.getByRole('link', { name: 'Tunnel' }).click()

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('calls onClick when an external link is clicked', async function () {
    const onClick = vi.fn(e => e.preventDefault())
    const screen = await render(
      <ButtonLink href="https://hemi.xyz" onClick={onClick}>
        Hemi
      </ButtonLink>,
    )

    await screen.getByRole('link', { name: 'Hemi' }).click()

    expect(onClick).toHaveBeenCalledOnce()
  })
})
