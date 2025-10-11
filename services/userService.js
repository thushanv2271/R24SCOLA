const API_BASE_URL = "https://webapplication2-old-pond-3577.fly.dev/api";

export const fetchUserByEmail = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/Users/${email}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch user data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const updateUser = async (userId, userData, token) => {
  try {
    const response = await fetch(`${API_BASE_URL}/Users/${userId}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : undefined
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const rawResponse = await response.text();
      let errorMessage = 'Failed to update user data';
      try {
        const errorData = rawResponse ? JSON.parse(rawResponse) : null;
        errorMessage = errorData?.message || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse server response:', parseError);
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return userData;
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
}; 