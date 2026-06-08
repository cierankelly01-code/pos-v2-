import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import OfflineBanner from '@/components/OfflineBanner';
import OrderPage from '@/pages/OrderPage';
import BarPage from '@/pages/BarPage';
import AdminPage from '@/pages/AdminPage';
import RoleSelect from '@/pages/RoleSelect';
import LiveTables from '@/pages/LiveTables';
import BookingsPage from '@/pages/BookingsPage';

function PageBoundary({ children }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <OfflineBanner />
        <Router>
          <Routes>
            <Route path="/" element={<PageBoundary><RoleSelect /></PageBoundary>} />
            <Route path="/order" element={<PageBoundary><OrderPage /></PageBoundary>} />
            <Route path="/bar" element={<PageBoundary><BarPage /></PageBoundary>} />
            <Route path="/admin" element={<PageBoundary><AdminPage /></PageBoundary>} />
            <Route path="/tables" element={<PageBoundary><LiveTables /></PageBoundary>} />
            <Route path="/bookings" element={<PageBoundary><BookingsPage /></PageBoundary>} />
          </Routes>
        </Router>
        <Toaster />
        <SonnerToaster position="top-center" />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
