import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ProductModal from '../components/Product/ProductModal';
import CartDrawer from '../components/Cart/CartDrawer';

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { search } = useLocation();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);

  const searchParams = new URLSearchParams(search);
  const initialSize = searchParams.get('size') || null;

  useEffect(() => {
    axios
      .get(`/api/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch((err) => {
        console.error('Ошибка при загрузке товара:', err);
      });

    axios
      .get('/api/products')
      .then((res) => {
        const others = res.data.filter((p) => String(p.id) !== id);
        setRelated(shuffle(others).slice(0, 4));
      })
      .catch(console.error);
  }, [id, navigate]);

  if (!product) return null;

  return (
    <div className="min-h-screen">
      <ProductModal
        product={product}
        relatedProducts={related}
        hideCloseButton={false}
        showCartIcon={true}
        initialSize={initialSize}
        onClose={() => navigate('/', { replace: true })}
        closeOnAddToCart={false}
        onSelectProduct={(p) => {
          navigate(`/product/${p.id}`, { replace: false });
        }}
      />
      <CartDrawer />
    </div>
  );
}
