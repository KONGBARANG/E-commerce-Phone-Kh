const API_URL = 'http://localhost:5000/api/products';

export const fetchProducts = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return await response.json();
  } catch (error) {
    console.error('Error in productService:', error);
    throw error;
  }
};