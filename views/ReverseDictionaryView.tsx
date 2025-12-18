import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { findWordFromDefinition } from '../services/geminiService';
import Loader from '../components/Loader';
import Mascot from '../components/Mascot';

const ReverseDictionaryView: React.FC = () => {
    const [input, setInput] = useState('');
    const [results, setResults] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim().length < 10) {
            setError('Please enter a more descriptive phrase (at least 10 characters).');
            return;
        }
        setError(null);
        setIsLoading(true);
        setResults([]);
        try {
            const words = await findWordFromDefinition(input);
            setResults(words);
        // FIX: Added type annotation to catch block and improved error message propagation.
        } catch (err: any) {
            setError(err?.message || 'An error occurred while fetching results. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-title font-bold text-neutral">Reverse Dictionary</h1>
                <p className="text-neutral-content mt-1">Describe a concept, and AI will find the word for it.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., 'the feeling of being happy for someone else’s success'"
                    className="w-full h-32 p-4 bg-white border-2 border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                />
                 {error && <p className="text-sm text-error">{error}</p>}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-primary/50 flex items-center justify-center"
                >
                    {isLoading ? 'Searching...' : 'Find Word'}
                </button>
            </form>

            <div>
                {isLoading && <Loader message="AI is thinking..." />}

                {!isLoading && results.length === 0 && !error && (
                    <div className="text-center p-8 text-neutral-content">
                        <Mascot message="Struggling to find a word? Describe it to me and I'll do my best to find it!" />
                    </div>
                 )}

                <AnimatePresence>
                {results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3 mt-4"
                    >
                        <h2 className="text-xl font-title font-bold text-neutral">Suggestions:</h2>
                        {results.map((word, index) => (
                            <motion.div
                                key={word}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 bg-base-100 rounded-lg shadow-sm border border-base-200"
                            >
                                <p className="text-lg font-bold text-secondary">{word}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ReverseDictionaryView;