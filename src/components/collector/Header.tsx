export default function CollectorHeader() {
  return (
    <div className="w-full flex items-center justify-end px-6 py-4">
      <div className="text-sm text-gray-600">
        {new Date().toLocaleDateString('es-CO', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>
    </div>
  )
}
