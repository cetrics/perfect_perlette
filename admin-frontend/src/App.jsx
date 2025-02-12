import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import UploadProduct from "./pages/Product";
import UploadBlog from "./pages/UploadBlog";
import Contact from "./pages/Contact";
import Categories from "./pages/Categories";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/admin-dashboard" element={<Home />} />{" "}
        {/* This ensures Home is displayed at the root */}
        <Route path="/orders" element={<AdminDashboard />} />
        <Route path="/upload-product" element={<UploadProduct />} />
        <Route path="/upload-blog" element={<UploadBlog />} />
        <Route path="/contacts" element={<Contact />} />
        <Route path="/all_categories" element={<Categories />} />
      </Routes>
    </Router>
  );
};

export default App;
