import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/render'
import { LoadPage } from './LoadPage'

// Component-level version of UC17 (docs/07): a constraint written in plain
// language is shown in readable form and saved only after confirmation (AD-8).
describe('LoadPage', () => {
  it('turns a sentence into a rule and saves it after confirmation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoadPage />)

    expect(await screen.findByText('Constraints and wishes (1)')).toBeInTheDocument()
    await user.type(screen.getByLabelText('Constraint in plain language'), 'Omarov cannot teach on Friday afternoon')
    await user.click(screen.getByRole('button', { name: 'Recognise' }))

    expect(await screen.findByText('The assistant understood:')).toBeInTheDocument()
    expect(screen.getByText(/Daniyar Omarov is unavailable: Friday, 12:00–15:50/)).toBeInTheDocument()
    expect(screen.getByText('Constraints and wishes (1)')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirm and save' }))
    expect(await screen.findByText('Constraints and wishes (2)')).toBeInTheDocument()
    expect(screen.getByText(/«Omarov cannot teach on Friday afternoon»/)).toBeInTheDocument()
  })

  it('warns about an unknown name instead of guessing', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoadPage />)

    await user.type(await screen.findByLabelText('Constraint in plain language'), 'Иванов не может вести в пятницу')
    await user.click(screen.getByRole('button', { name: 'Recognise' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('"Иванов" was not found')
  })
})
