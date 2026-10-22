import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/render'
import { SchedulePage } from './SchedulePage'

// Component-level version of T-E2E-01 (docs/09).
describe('SchedulePage', () => {
  it('shows the selected group schedule and filters it by day', async () => {
    const user = userEvent.setup()
    renderWithProviders(<SchedulePage />, { route: '/schedule?view=group&id=1' })

    // Desktop table and mobile list are both rendered (CSS hides one of them).
    expect((await screen.findAllByText('Software Engineering')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Web Development').length).toBeGreaterThan(0)

    await user.selectOptions(screen.getByLabelText('Day'), 'Wednesday')
    expect(screen.queryByText('Software Engineering')).not.toBeInTheDocument()
    expect(screen.getAllByText('Web Development').length).toBeGreaterThan(0)
  })

  it('asks to choose a group when nothing is selected', async () => {
    renderWithProviders(<SchedulePage />, { route: '/schedule' })
    expect(await screen.findByText(/choose a group, teacher or room/i)).toBeInTheDocument()
  })
})
