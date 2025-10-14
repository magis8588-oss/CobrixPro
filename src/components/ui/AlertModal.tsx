import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
}

export default function AlertModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info' 
}: AlertModalProps) {
  if (!isOpen) return null

  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-900',
      button: 'bg-green-600 hover:bg-green-700'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-900',
      button: 'bg-red-600 hover:bg-red-700'
    },
    warning: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-600',
      title: 'text-orange-900',
      button: 'bg-orange-600 hover:bg-orange-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      button: 'bg-blue-600 hover:bg-blue-700'
    }
  }

  const style = styles[type]

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : AlertCircle

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full animate-fadeIn">
        <div className={`${style.bg} border-b ${style.border} px-6 py-4 rounded-t-xl flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <Icon className={style.icon} size={24} />
            <h3 className={`text-lg font-bold ${style.title}`}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 hover:bg-white/50 rounded-lg transition-colors`}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 whitespace-pre-line">{message}</p>
        </div>

        <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2 ${style.button} text-white rounded-lg transition-colors font-medium`}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}
