import React, { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  const [backendData, setBackendData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchBackendData = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/hello')
      setBackendData(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to connect to backend: ' + err.message)
      setBackendData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBackendData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-4">
            🚀 Phase 1
          </h1>
          <p className="text-xl text-gray-600">
            Full-Stack Project Setup - Hello World
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              React
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Express
            </span>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              MongoDB
            </span>
            <span className="bg-cyan-100 text-cyan-800 px-3 py-1 rounded-full text-sm font-medium">
              Tailwind
            </span>
          </div>
        </header>

        {/* Connection Status */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Connection Status
            </h2>
            
            {loading && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-4 text-gray-600">Connecting to backend...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="text-red-500 mr-3">❌</div>
                  <div>
                    <h3 className="text-red-800 font-semibold">Connection Error</h3>
                    <p className="text-red-600">{error}</p>
                  </div>
                </div>
                <button
                  onClick={fetchBackendData}
                  className="mt-3 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Retry Connection
                </button>
              </div>
            )}

            {backendData && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="text-green-500 mr-3">✅</div>
                    <div>
                      <h3 className="text-green-800 font-semibold">Successfully Connected!</h3>
                      <p className="text-green-600">Frontend and backend are communicating properly</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Backend Response</h4>
                    <p className="text-gray-600">{backendData.backend}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Database Response</h4>
                    <p className="text-gray-600">{backendData.database}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(backendData.databaseTimestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-700 mb-2">Status</h4>
                  <p className="text-blue-600">{backendData.status}</p>
                </div>

                <button
                  onClick={fetchBackendData}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors w-full md:w-auto"
                >
                  🔄 Refresh Data
                </button>
              </div>
            )}
          </div>

          {/* Project Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Project Structure
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Frontend</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• React 18</li>
                  <li>• Vite</li>
                  <li>• Tailwind CSS</li>
                  <li>• Axios</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Backend</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Node.js + Express</li>
                  <li>• MongoDB Atlas</li>
                  <li>• Mongoose ODM</li>
                  <li>• CORS + Helmet</li>
                </ul>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-2">Features</h3>
                <ul className="text-gray-600 space-y-1">
                  <li>• Hot Reload</li>
                  <li>• API Proxy</li>
                  <li>• Error Handling</li>
                  <li>• Responsive Design</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App