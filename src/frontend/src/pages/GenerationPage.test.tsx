import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../test/render'
import { GenerationPage } from './GenerationPage'

// Component-level version of UC18/UC19 (docs/07): generate a draft, check the
// quality report, look at a group, publish.
describe('GenerationPage', () => {
  it('generates a conflict-free draft and publishes it', async () => {
    const user = userEvent.setup()
    renderWithProviders(<GenerationPage />)

    await user.click(await screen.findByRole('button', { name: 'Generate' }))

    const report = await screen.findByLabelText('Quality report')
    expect(within(report).getByText('Lessons placed').nextElementSibling).toHaveTextContent('21 / 21')
    expect(within(report).getByText('Hard-constraint violations').nextElementSibling).toHaveTextContent('0')
    // draft preview of the first group
    expect((await screen.findAllByText('Software Engineering')).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Publish' }))
    expect(await screen.findByText('Published: everyone now sees the new timetable')).toBeInTheDocument()
  })

  it('explains the result in plain language', async () => {
    const user = userEvent.setup()
    renderWithProviders(<GenerationPage />)

    await user.click(await screen.findByRole('button', { name: 'Generate' }))
    await user.click(await screen.findByRole('button', { name: /Explain \(AI\)/ }))

    expect(await screen.findByText(/The draft places 21 of 21 lessons/)).toBeInTheDocument()
  })
})
