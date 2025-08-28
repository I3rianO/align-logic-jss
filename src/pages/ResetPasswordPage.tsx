// src/pages/ResetPasswordPage.tsx
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const empId = params.get("empId");

  const handleResetClick = () => {
    if (empId) {
      // ✅ Pass empId to security-questions route
      navigate(`/security-questions?empId=${encodeURIComponent(empId)}`);
    } else {
      alert("No Employee ID in URL. Please return to login and try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Reset Your Password</h1>
        <p className="text-gray-600 mb-6">
          Answer your security questions to reset your password.
        </p>

        {empId ? (
          <div className="mb-4 p-2 text-sm bg-yellow-50 border border-yellow-200 rounded">
            Employee ID detected: <span className="font-semibold">{empId}</span>
          </div>
        ) : (
          <div className="mb-4 p-2 text-sm bg-red-50 border border-red-200 rounded text-red-700">
            No Employee ID in URL. Please return to login and start again.
          </div>
        )}

        <div className="flex justify-between">
          <button
            className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
            onClick={() => navigate("/")}
          >
            Back to Login
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleResetClick}
          >
            Reset Password
          </button>
        </div>
      </div>
    </div>
  );
}
