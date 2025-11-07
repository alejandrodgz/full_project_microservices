"use client"
import { useAuth } from '../providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { APP_ROUTES } from '@/lib/api-constants'
import { useEffect } from 'react'

export default function MePage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(APP_ROUTES.LOGIN)
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <div className="text-center">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push(APP_ROUTES.LOGIN)
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Mi Perfil</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => router.push(APP_ROUTES.DOCUMENTS.BASE)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-200"
          >
            Ver Documentos
          </button>
          <button 
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors duration-200"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Información Personal</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <p className="text-lg text-gray-900">{user.email || 'No especificado'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">ID Ciudadano</label>
              <p className="text-lg text-gray-900">{user.id_citizen || user.citizen_id || user.sub || 'No especificado'}</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Estado de Autenticación</h3>
          <div className="space-y-2">
            <p className="text-blue-700">
              Usuario autenticado correctamente
            </p>
            <p className="text-sm text-blue-600">
              Los tokens se renuevan automáticamente en segundo plano
            </p>
            <p className="text-sm text-blue-600">
              Sesión activa y segura
            </p>
          </div>
        </div>

        <div className="p-6 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Información Técnica</h3>
          <div className="space-y-2 text-sm">
            <p className="text-green-700">
              <strong>Token válido:</strong> Sí
            </p>
            <p className="text-green-700">
              <strong>Renovación automática:</strong> Activa
            </p>
            <p className="text-green-700">
              <strong>Método de autenticación:</strong> JWT con refresh token
            </p>
          </div>
        </div>

        <div className="p-6 bg-yellow-50 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">Acciones Rápidas</h3>
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => router.push(APP_ROUTES.DOCUMENTS.BASE)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors duration-200"
            >
              Gestionar Documentos
            </button>
            <button 
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors duration-200"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
