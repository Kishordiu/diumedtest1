import { AuthProvider } from '../core/auth/AuthContext'
import Router from './Router'

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  )
}
