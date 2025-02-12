// src/components/ProtectedRoute.jsx

import React, { useEffect, useState } from "react";
import { Route, Navigate } from "react-router-dom";
import axios from "axios";

const ProtectedRoute = ({ element: Element, ...rest }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    axios
      .get("/check-login") // Check login status from backend
      .then((response) => {
        setIsAuthenticated(response.data.logged_in);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });
  }, []);

  return (
    <Route
      {...rest}
      element={isAuthenticated ? Element : <Navigate to="/admin-login" />}
    />
  );
};

export default ProtectedRoute;
