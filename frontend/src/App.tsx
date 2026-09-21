import { Route, Routes } from 'react-router-dom'

import RotaProtegida from '@/components/RotaProtegida'
import Inicio from '@/pages/Inicio'
import Login from '@/pages/Login'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RotaProtegida />}>
        <Route path="/" element={<Inicio />} />
      </Route>
    </Routes>
  )
}
