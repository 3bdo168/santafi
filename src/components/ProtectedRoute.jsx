// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useBranch } from "../context/BranchContext";

const ProtectedRoute = ({ children, requiredRole, requiredBranch }) => {
  const { currentUser, role, branchId, loading } = useBranch();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // مش مسجل دخول
  if (!currentUser) return <Navigate to="/admin" />;

  // role غلط
  if (requiredRole && role !== requiredRole) return <Navigate to="/admin" />;

  // admin بيحاول يدخل على فرع مش بتاعه
  if (role === "admin" && requiredBranch && branchId !== requiredBranch) {
    return <Navigate to={`/admin/dashboard/${branchId}`} />;
  }

  return children;
};

export default ProtectedRoute;