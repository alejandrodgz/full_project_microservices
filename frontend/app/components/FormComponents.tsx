import React from 'react'

interface ErrorAlertProps {
  error: string | null
  className?: string
}

export function ErrorAlert({ error, className = '' }: ErrorAlertProps) {
  if (!error) return null

  return (
    <div className={`bg-red-50 border-l-4 border-red-400 p-4 rounded-lg ${className}`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      </div>
    </div>
  )
}

interface FormInputProps {
  value: string | number
  onChange: (value: string) => void
  placeholder: string
  type?: string
  required?: boolean
  className?: string
}

export function FormInput({ 
  value, 
  onChange, 
  placeholder, 
  type = 'text', 
  required = false,
  className = '' 
}: FormInputProps) {
  return (
    <input 
      required={required}
      value={value} 
      onChange={e => onChange(e.target.value)} 
      type={type}
      placeholder={placeholder} 
      className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${className}`}
    />
  )
}

interface SubmitButtonProps {
  loading: boolean
  loadingText: string
  text: string
  className?: string
  disabled?: boolean
}

export function SubmitButton({ 
  loading, 
  loadingText, 
  text, 
  className = '',
  disabled = false 
}: SubmitButtonProps) {
  return (
    <button 
      disabled={loading || disabled} 
      className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${className}`}
    >
      {loading ? loadingText : text}
    </button>
  )
}

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  linkText: string
  linkHref: string
  linkLabel: string
}

export function AuthLayout({ 
  children, 
  title, 
  subtitle, 
  linkText, 
  linkHref, 
  linkLabel 
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        
        {children}
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {linkText}{' '}
            <a href={linkHref} className="text-blue-600 hover:text-blue-700 font-semibold">
              {linkLabel}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
