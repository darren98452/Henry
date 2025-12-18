import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { UserContext } from '../contexts/UserContext';
import Mascot from '../components/Mascot';

type AuthMode = 'signIn' | 'signUp';

const AuthView: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('signIn');
    const { signIn, signUp, signInWithGoogle, isLoading, error } = useContext(UserContext);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [formError, setFormError] = useState<string | null>(null);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (mode === 'signUp' && password !== confirmPassword) {
            setFormError("Passwords do not match.");
            return;
        }

        try {
            if (mode === 'signIn') {
                await signIn(email, password);
            } else {
                await signUp(email, password);
            }
        } catch (err: any) {
            setFormError(err.message || "An unexpected error occurred.");
        }
    };
    
    const GoogleIcon = () => (
      <svg viewBox="0 0 48 48" className="w-6 h-6 mr-3">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.021,35.592,44,30.032,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
      </svg>
    );

    return (
        <div className="min-h-screen bg-base-200 flex flex-col justify-center items-center p-4 font-sans">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
            >
                <Mascot size="lg" />
                <h1 className="text-3xl font-title font-bold text-neutral mt-4">Hello, this is Henry</h1>
                <p className="text-neutral-content">Your personal vocabulary trainer.</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-sm bg-base-100 p-8 rounded-2xl shadow-xl"
            >
                <div className="flex bg-base-200 p-1 rounded-full mb-6">
                    <button
                        onClick={() => setMode('signIn')}
                        className={`w-1/2 py-2 text-sm font-semibold rounded-full transition-colors ${mode === 'signIn' ? 'bg-primary text-white shadow' : 'text-neutral-content'}`}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setMode('signUp')}
                        className={`w-1/2 py-2 text-sm font-semibold rounded-full transition-colors ${mode === 'signUp' ? 'bg-primary text-white shadow' : 'text-neutral-content'}`}
                    >
                        Sign Up
                    </button>
                </div>
                
                <AnimatePresence mode="wait">
                    <motion.form
                        key={mode}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        onSubmit={handleFormSubmit}
                        className="space-y-4"
                    >
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-content/50" size={20} />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 bg-base-200 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-content/50" size={20} />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full pl-10 pr-4 py-3 bg-base-200 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition"
                            />
                        </div>

                        {mode === 'signUp' && (
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-content/50" size={20} />
                                <input
                                    type="password"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-base-200 border border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition"
                                />
                            </div>
                        )}
                        
                        {(formError || error) && <p className="text-sm text-center text-error">{formError || error}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-primary/50 flex items-center justify-center"
                        >
                            {isLoading ? 'Please wait...' : (mode === 'signIn' ? 'Sign In' : 'Create Account')}
                        </button>
                    </motion.form>
                </AnimatePresence>

                <div className="flex items-center my-6">
                    <div className="flex-grow bg-base-300 h-px"></div>
                    <span className="mx-4 text-xs text-neutral-content">OR</span>
                    <div className="flex-grow bg-base-300 h-px"></div>
                </div>

                <button
                    onClick={signInWithGoogle}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center py-3 px-4 bg-base-100 border border-base-300 rounded-lg hover:bg-base-200 transition-colors disabled:opacity-50"
                >
                    <GoogleIcon />
                    <span className="font-semibold text-neutral-content text-sm">Continue with Google</span>
                </button>
            </motion.div>
        </div>
    );
};

export default AuthView;