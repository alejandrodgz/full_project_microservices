import '../styles/globals.css'
import React from 'react'
import type { Metadata } from 'next'
import AuthProvider from './providers/AuthProvider'
import ToastProvider from './providers/ToastProvider'
import ErrorBoundaryWithToast from './components/ErrorBoundaryWithToast'
import Navbar from './components/Navbar'

export const metadata: Metadata = {
  title: 'Carpeta Ciudadana ',
  description: 'Carpeta Ciudadana - Tu espacio digital seguro para gestionar, autenticar y compartir documentos oficiales'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <ToastProvider>
            <ErrorBoundaryWithToast>
              <Navbar />
              <main>
                {children}
              </main>
            </ErrorBoundaryWithToast>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
