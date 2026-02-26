import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BuyersPage from './pages/BuyersPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import PublicOfferPage from './pages/PublicOfferPage';
import ProductDetailPage from './pages/ProductDetailPage';
import PaymentResult from './pages/PaymentResult';
import NotFoundPage from './pages/NotFoundPage';
import { ModalProvider } from './context/ModalContext';

function App() {
  return (
    <ModalProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/buyers" element={<BuyersPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/public-offer" element={<PublicOfferPage />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ModalProvider>
  );
}

export default App;
