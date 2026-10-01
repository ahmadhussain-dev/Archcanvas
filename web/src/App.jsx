import { Route, Routes } from 'react-router'
import Placeholder from './pages/Placeholder.jsx'
import NotFound from './pages/NotFound.jsx'

// Routes from the approved sitemap. Each page is a placeholder until it is built.
const pages = [
  { path: '/', title: 'Landing page' },
  { path: '/login', title: 'Log in' },
  { path: '/register', title: 'Create account' },
  { path: '/dashboard', title: 'My projects', app: true },
  { path: '/projects/new', title: 'Plot setup', app: true },
  { path: '/projects/:id/editor', title: 'Editor', app: true },
  { path: '/projects/:id/estimate', title: 'Grey structure estimate', app: true },
  { path: '/admin/prices', title: 'Material prices', app: true }
]

export default function App() {
  return (
    <Routes>
      {pages.map((p) => (
        <Route key={p.path} path={p.path} element={<Placeholder title={p.title} app={p.app} />} />
      ))}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
