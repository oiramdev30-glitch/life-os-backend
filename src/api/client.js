import axios from 'axios';

// Configuramos la base URL de tu servidor FastAPI
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;