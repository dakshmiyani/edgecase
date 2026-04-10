const API_BASE_URL = 'http://localhost:5000/api';

export const verifyUser = async (proofData) => {
  const response = await fetch(`${API_BASE_URL}/verify-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(proofData)
  });
  return response.json();
};

export const makeTransaction = async (txData) => {
  const response = await fetch(`${API_BASE_URL}/transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(txData)
  });
  return response.json();
};
