import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import GroupListPage from '../pages/groups/GroupListPage';
import GroupDetailPage from '../pages/groups/GroupDetailPage';
import CreateGroupPage from '../pages/groups/CreateGroupPage';
import AddExpensePage from '../pages/expenses/AddExpensePage';
import ExpenseDetailPage from '../pages/expenses/ExpenseDetailPage';
import ReceiptScanPage from '../pages/expenses/ReceiptScanPage';
import SettlementPage from '../pages/SettlementPage';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function RequireGuest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/" replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
      <Route path="/register" element={<RequireGuest><RegisterPage /></RequireGuest>} />

      <Route path="/" element={<RequireAuth><GroupListPage /></RequireAuth>} />
      <Route path="/groups/new" element={<RequireAuth><CreateGroupPage /></RequireAuth>} />
      <Route path="/groups/:id" element={<RequireAuth><GroupDetailPage /></RequireAuth>} />
      <Route path="/groups/:id/expenses/new" element={<RequireAuth><AddExpensePage /></RequireAuth>} />
      <Route path="/groups/:id/expenses/:expenseId" element={<RequireAuth><ExpenseDetailPage /></RequireAuth>} />
      <Route path="/groups/:id/receipt-scan" element={<RequireAuth><ReceiptScanPage /></RequireAuth>} />
      <Route path="/groups/:id/settle" element={<RequireAuth><SettlementPage /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
