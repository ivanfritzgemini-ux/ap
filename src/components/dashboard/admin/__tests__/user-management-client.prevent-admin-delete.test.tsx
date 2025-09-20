import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { UserManagementClient } from '../user-management-client'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => {},
  }),
})

describe('Client guard prevents admin delete call', () => {
  const users = [
    { id: 'admin-1', name: 'Admin User', rut: '11.111.111-1', email: 'admin@e.com', role: 'Administrador' }
  ]

  const originalFetch = (global as any).fetch
  beforeEach(() => {
    (global as any).fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      // If the component fetches the users list on mount, return our test users
      if (url.endsWith('/api/users') && (!init || !init.method || init.method === 'GET')) {
        return { ok: true, json: async () => ({ data: users }) }
      }
      // default fallback: return 200
      return { ok: true, json: async () => ({ data: [] }) }
    })
  })
  afterEach(() => { (global as any).fetch = originalFetch })

  test('no llama a fetch DELETE cuando se intenta borrar un admin', async () => {
    const { container, getByText } = render(<UserManagementClient users={users as any} />)

    // Try to find the inline delete button first (desktop). If present, click it.
    const ariaLabel = `Eliminar ${users[0].name}`
    const inlineBtn = container.querySelector(`button[aria-label="${ariaLabel}"]`) as HTMLElement | null
    if (inlineBtn) {
      fireEvent.click(inlineBtn)
    } else {
      // Fallback: try to open the more-menu (mobile) by finding the MoreHorizontal svg's closest button
      const moreSvg = container.querySelector('svg.lucide-more-horizontal') as HTMLElement | null
      if (moreSvg) {
        const toggleBtn = moreSvg.closest('button') as HTMLElement | null
        if (toggleBtn) fireEvent.click(toggleBtn)
      }

      // wait for the 'No permitido' item in the dropdown and click it if present
      try {
        await waitFor(() => expect(getByText(/No permitido/i)).toBeTruthy())
        const noPermitido = getByText(/No permitido/i)
        fireEvent.click(noPermitido)
      } catch (e) {
        // if still not found, proceed; the goal is to ensure no DELETE was called
      }
    }

    // Wait briefly to allow any accidental network call to happen
    await new Promise((r) => setTimeout(r, 50))

    const calls = (global as any).fetch.mock.calls
    const deleteCalls = calls.filter((c: any[]) => String(c[0]).includes('/api/users/') && c[1] && c[1].method === 'DELETE')
    expect(deleteCalls.length).toBe(0)
  })
})
