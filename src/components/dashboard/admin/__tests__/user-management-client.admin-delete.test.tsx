import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
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

describe('UserManagementClient admin delete protection', () => {
  const users = [
    { id: '1', name: 'Admin User', rut: '11.111.111-1', email: 'admin@e.com', role: 'Administrador' }
  ]

  const originalFetch = (global as any).fetch
  beforeEach(() => {
    (global as any).fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url.endsWith('/api/users')) {
        return { ok: true, json: async () => ({ data: users }) }
      }
      if (url.endsWith('/api/roles')) {
        return { ok: true, json: async () => ({ data: [{ id: 'r1', nombre_rol: 'Administrador' }] }) }
      }
      if (url.endsWith('/api/sexos')) {
        return { ok: true, json: async () => ({ data: [] }) }
      }
      return { ok: false, json: async () => ({ error: 'not found' }) }
    }
  })
  afterEach(() => { (global as any).fetch = originalFetch })

  test('boton eliminar inline está deshabilitado para administrador y muestra explicación', async () => {
    const { container } = render(<UserManagementClient users={users as any} />)
    await waitFor(() => {
      // ahora la acción de eliminar NO debe renderizarse para administradores
      const btn = container.querySelector('button[aria-label^="Eliminar"]') as HTMLButtonElement | null
      expect(btn).toBeNull()
      // tampoco debe mostrarse el texto de 'No permitido'
      const noPermitido = container.querySelector('div,span')?.textContent || ''
      expect(noPermitido).not.toMatch(/No permitido/i)
    })
  })
})
