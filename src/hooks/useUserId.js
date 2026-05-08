import { useAuth } from "../context/AuthContext";

const useUserId = () => {
    const { user } = useAuth();
    return user?.user_id || null;
};

export default useUserId;
