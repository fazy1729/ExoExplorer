// exoexplorer/src/components/Auth/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import axios from 'axios';

const AdminRoute = ({ children }) => {
    const { token, isAuthenticated } = useAuth();
    const [isAdmin, setIsAdmin] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const checkAdmin = async () => {
            try {
                const response = await axios.get('http://localhost:8000/users/me/admin/', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setIsAdmin(true);
            } catch (err) {
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            checkAdmin();
        } else {
            setLoading(false);
        }
    }, [token, isAuthenticated]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;