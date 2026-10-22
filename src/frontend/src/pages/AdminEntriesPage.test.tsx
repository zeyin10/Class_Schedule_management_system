import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/render'
import { AdminEntriesPage } from './AdminEntriesPage'

// Component-level version of T-E2E-02 (docs/09): the admin creates a conflicting
// entry, sees a readable conflict message and the entry is not saved.
describe('AdminEntriesPage', () => {
  it('shows a conflict message and does not save a double-booked entry', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminEntriesPage />)

    expect(await screen.findByText('Entries: 18')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /new entry/i }))

    // Defaults: Monday, slot 1, first teacher and first room - already used by seed entry 1.
    const form = screen.getByRole('form', { name: /new entry/i })
    await user.click(within(form).getByLabelText(/SE-2431/))
    await user.click(within(form).getByRole('button', { name: 'Save' }))

    const alert = await within(form).findByRole('alert')
    expect(alert).toHaveTextContent('Conflict: the entry was not saved')
    expect(alert).toHaveTextContent('Teacher Aliya Bekova already has Software Engineering')
    expect(alert).toHaveTextContent('Room C1.1.239 is already booked')
    expect(alert).toHaveTextContent('Group SE-2431 already has Software Engineering')
    expect(screen.getByText('Entries: 18')).toBeInTheDocument()
  })

  it('requires at least one group', async () => {
    const user = userEvent.setup()
    renderWithProviders(<AdminEntriesPage />)

    await user.click(await screen.findByRole('button', { name: /new entry/i }))
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('Select at least one group')).toBeInTheDocument()
  })
})
