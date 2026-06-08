import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/AuthContext';
import OrderPage from '@/pages/OrderPage';
import BarPage from '@/pages/BarPage';
import AdminPage from '@/pages/AdminPage';
import RoleSelect from '@/pages/RoleSelect';
import LiveTables from '@/pages/LiveTables';
import BookingsPage from '@/pages/BookingsPage';

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/" element={<RoleSelect />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/bar" element={<BarPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/tables" element={<LiveTables />} />
            <Route path="/bookings" element={<BookingsPage />} />
          </Routes>
        </Router>
        <Toaster />
        <SonnerToaster position="top-center" />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App