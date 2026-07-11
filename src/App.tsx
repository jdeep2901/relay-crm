import { HashRouter, Routes, Route } from 'react-router-dom'
import { Shell } from './components/Shell'
import { AuthGate } from './components/AuthGate'
import { Today } from './views/Today'
import { Pipeline } from './views/Pipeline'
import { DealDetail } from './views/DealDetail'
import { Capture } from './views/Capture'
import { Relationships } from './views/Relationships'
import { Accounts } from './views/Accounts'

export default function App() {
  return (
    <AuthGate>
      <HashRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/deal/:id" element={<DealDetail />} />
            <Route path="/capture" element={<Capture />} />
            <Route path="/relationships" element={<Relationships />} />
            <Route path="/accounts" element={<Accounts />} />
          </Routes>
        </Shell>
      </HashRouter>
    </AuthGate>
  )
}
