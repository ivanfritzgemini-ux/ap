import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { UserManagementClient } from '../user-management-client'

// Mock window.matchMedia for useIsMobile hook (if necessary in test environment)
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

describe('UserManagementClient actions UI', () => {
  const users = [
    { id: '1', name: 'Juan Perez', rut: '123', email: 'a@b.c', role: 'Profesor' },
    { id: '2', name: 'Admin User', rut: '456', email: 'd@e.f', role: 'Administrador' }
  ]

  // Provide simple fetch mock so the component's useEffect doesn't overwrite props with empty data
  const originalFetch = (global as any).fetch
  beforeEach(() => {
    (global as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/api/users')) {
        return { ok: true, json: async () => ({ data: users }) }
      }
      if (url.endsWith('/api/roles')) {
        return { ok: true, json: async () => ({ data: [{ id: 'r1', nombre_rol: 'Profesor' }, { id: 'r2', nombre_rol: 'Administrador' }] }) }
      }
      if (url.endsWith('/api/sexos')) {
        return { ok: true, json: async () => ({ data: [{ id: 's1', nombre: 'Masculino' }, { id: 's2', nombre: 'Femenino' }] }) }
      }
      return { ok: false, json: async () => ({ error: 'not found' }) }
    }
  })

  afterEach(() => {
    (global as any).fetch = originalFetch
  })

  test('muestra botones icon-only (editar/eliminar) en escritorio', async () => {
    const { container } = render(<UserManagementClient users={users as any} />)
    // Wait for the component's effect to finish and rows to render
    await waitFor(() => {
      const editButtons = container.querySelectorAll('button[aria-label^="Editar"], button[aria-label*="Editar"]')
      const deleteButtons = container.querySelectorAll('button[aria-label^="Eliminar"], button[aria-label*="Eliminar"]')
      expect(editButtons.length).toBeGreaterThanOrEqual(1)
      expect(deleteButtons.length).toBeGreaterThanOrEqual(1)
    })
  })

  test('en móvil se muestra el dropdown (more button) por usuario', async () => {
    // The component renders a small-screen dropdown trigger with a visually-hidden label
    const { container } = render(<UserManagementClient users={users as any} />)
    await waitFor(() => {
      const ariaPopupButtons = container.querySelectorAll('button[aria-haspopup]')
      const srOnly = container.querySelectorAll('span.sr-only')
      expect(ariaPopupButtons.length + srOnly.length).toBeGreaterThanOrEqual(1)
    })
  })
})
