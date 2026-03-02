import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Gift } from 'lucide-react'
import { selectIsAuthenticated, dummyLogin } from '../features/authSlice'

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/', { replace: true })
    return null
  }

  const handleLogin = (e) => {
    e.preventDefault()
    dispatch(dummyLogin())
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">QuickGift Admin</h1>
          <p className="text-gray-500 mt-1">Sign in to manage your platform</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          <p className="text-sm text-gray-500 text-center">
            Click below to access the admin dashboard
          </p>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Login as Admin
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          QuickGift Admin Panel v1.0
        </p>
      </div>
    </div>
  )
}
