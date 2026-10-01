import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import FullPageSpinner from './components/FullPageSpinner.jsx'
import Placeholder from './pages/Placeholder.jsx'
import AppLayout from './layouts/AppLayout.jsx'
import { GuestOnly, RequireAdmin, RequireAuth } from './auth/guards.jsx'

// Each page loads its own illustrations, so pages are split into separate files.
const Landing = lazy(() => import('./pages/landing/Landing.jsx'))
const Login = lazy(() => import('./pages/auth/Login.jsx'))
const Register = lazy(() => import('./pages/auth/Register.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))
const Dashboard = lazy(() => import('./pages/app/Dashboard.jsx'))
const NewProject = lazy(() => import('./pages/app/NewProject.jsx'))
const Estimate = lazy(() => import('./pages/app/Estimate.jsx'))
const AdminPrices = lazy(() => import('./pages/app/AdminPrices.jsx'))

// Routes from the approved sitemap.
export default function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects/:id/estimate" element={<Estimate />} />
            <Route element={<RequireAdmin />}>
              <Route path="/admin/prices" element={<AdminPrices />} />
            </Route>
          </Route>
          <Route path="/projects/new" element={<NewProject />} />
          <Route path="/projects/:id/editor" element={<Placeholder title="Editor" />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
