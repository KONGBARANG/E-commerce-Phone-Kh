import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import AboutPage from '../pages/AboutPage';

function AppRoutes({ searchTerm, cart, setCart }) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            searchTerm={searchTerm}
            cart={cart}
            setCart={setCart}
          />
        }
      />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  );
}

export default AppRoutes;