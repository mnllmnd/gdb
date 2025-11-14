import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../services/api';

export const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage('Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiClient.post('/auth/reset-password', {
                token,
                newPassword
            });
            // apiClient returns parsed JSON body
            setMessage(response?.message || 'Mot de passe réinitialisé');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (error: unknown) {
            // apiClient throws the parsed error body on non-2xx
            const err = error as any;
            const msg = err?.message || err?.error || 'Une erreur est survenue';
            setMessage(msg);
        }
        setIsLoading(false);
    };

    if (!token) {
        return (
            <div className="text-red-600 p-4">
                Lien de réinitialisation invalide
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6">Définir un nouveau mot de passe</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="newPassword">
                        Nouveau mot de passe
                    </label>
                    <input
                        type="password"
                        id="newPassword"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 mb-2" htmlFor="confirmPassword">
                        Confirmer le mot de passe
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        className="w-full px-3 py-2 border rounded-lg"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                    disabled={isLoading}
                >
                    {isLoading ? 'Modification en cours...' : 'Modifier le mot de passe'}
                </button>
            </form>
            {message && (
                <div className={`mt-4 p-3 rounded-lg ${
                    message.includes('succès') 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {message}
                </div>
            )}
        </div>
    );
};