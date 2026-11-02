import { render, screen } from '@testing-library/react'
import { AboutData } from './AboutData'

it('tells visitors how to get in touch', () => {
  render(<AboutData />)
  expect(screen.getByRole('link', { name: 'hej@kummelnaskartan.se' })).toHaveAttribute(
    'href',
    'mailto:hej@kummelnaskartan.se',
  )
})
