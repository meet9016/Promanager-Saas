import axios from './axiosInstance';

// Create a user (POST with FormData)
export const user_create = async (userData) => {
    try {
        const formData = new FormData();
        formData.append('full_name', userData.full_name);
        formData.append('email', userData.email);
        formData.append('number', userData.number);
        if (userData.permissions) {
            formData.append('permissions', JSON.stringify(userData.permissions));
        }
        return await axios.post('/user_create', formData);
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

// List users (POST request to fetch users)
export const user_list = async () => {
    try {
        const res = await axios.post('/user_list'); // Even if body is not required
        return res.data.data; // Extract 'data' from response
    } catch (error) {
        console.error('Error fetching user list:', error);
        throw error;
    }
};

// Delete user (POST with user ID as FormData or JSON)
export const user_delete = async (user_id) => {
    try {
        const formData = new FormData();
        formData.append('user_id', user_id); // 🔑 Exact key from API: "user_id"

        const response = await axios.post('/user_delete', formData);
        const result = response.data;

        if (result.success) {
            alert('User deleted successfully');
            window.dispatchEvent(new CustomEvent('usersUpdated')); // Optional refresh trigger
        } else {
            alert(result.message || 'User deletion failed');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('An error occurred while deleting the user');
    }
};


