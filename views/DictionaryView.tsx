import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWordDetails } from '../services/geminiService';
import Loader from '../components/Loader';
import { ArrowLeft, Search, PlusCircle, CheckCircle2 } from 'lucide-react';
import type { Word } from '../types';
import type { UseVocabularyReturn } from '../hooks/useVocabulary';
import Mascot from '../components/Mascot';

interface DictionaryViewProps {
    onBack: () => void;
    vocabulary: UseVocabularyReturn;
    addCustomWord: (word: Word) => Promise<void>;
}

const DifficultyBadge: React.FC<{ difficulty: 'easy' | 'medium' | 'hard' }> = ({ difficulty }) => {
    const colors = {
        easy: 'bg-green-100 text-green-800 border-green-200',
        medium: 'bg-amber-100 text-amber-800 border-amber-200',
        hard: 'bg-rose-100 text-rose-800 border-rose-200',
    };

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colors[difficulty] || colors.medium} ml-3 align-middle`}>
            {difficulty}
        </span>
    );
};

const DictionaryView: React.FC<DictionaryViewProps> = ({ onBack, vocabulary, addCustomWord }) => {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState<Word | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);
    const [addStatus, setAddStatus] = useState<'idle' | 'adding' | 'added'>('idle');

    useEffect(() => {
        setAddStatus('idle');
    }, [query]);

    const wordExists = useMemo(() => {
        if (!result) return false;
        return vocabulary.allWords.some(w => w.word.toLowerCase() === result.word.toLowerCase());
    }, [vocabulary.allWords, result]);

    const handleAddWord = async () => {
        if (!result || wordExists || addStatus !== 'idle') return;
        setAddStatus('adding');
        try {
            await addCustomWord(result);
            setAddStatus('added');
        } catch (err) {
            console.error("Failed to add word from dictionary:", err);
            setError("Couldn't add the word. Please try again.");
            setAddStatus('idle');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim().length < 2) {
            setError('Please enter a word to search.');
            return;
        }
        setError(null);
        setIsLoading(true);
        setSearched(true);
        setResult(null);

        try {
            const wordDetails = await getWordDetails(query);
            setResult(wordDetails);
            if (!wordDetails) {
                setError(`Could not find a definition for "${query}". Check the spelling or try another word.`);
            }
        } catch (err: any) {
            setError(err?.message || 'An error occurred while searching. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                 <button onClick={onBack} className="flex items-center space-x-2 text-primary font-semibold mb-4">
                    <ArrowLeft size={20} />
                    <span>Back to Home</span>
                </button>
                <h1 className="text-3xl font-title font-bold text-neutral">Dictionary</h1>
                <p className="text-neutral-content mt-1">Look up any word.</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., 'serendipity'"
                    className="w-full p-3 bg-white border-2 border-base-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition"
                    aria-label="Search for a word"
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary text-white font-bold p-3 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-primary/50 flex items-center justify-center"
                    aria-label="Search"
                >
                    <Search size={24} />
                </button>
            </form>

            <div className="mt-4 min-h-[300px]">
                {isLoading && <Loader message="Looking up your word..." />}
                <AnimatePresence>
                {error && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center p-4 text-error bg-error/10 rounded-lg"
                    >
                        {error}
                    </motion.div>
                )}
                </AnimatePresence>
                <AnimatePresence>
                {result && !isLoading && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-primary to-teal-400 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden"
                        >
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
                            <div className="absolute bottom-4 left-0 w-32 h-32 bg-white/10 rounded-tr-full"></div>
                            <div className="relative z-10 space-y-3">
                                <div>
                                    <div className="flex items-center flex-wrap">
                                        <h2 className="text-3xl font-bold">{result.word}</h2>
                                        <DifficultyBadge difficulty={result.difficulty} />
                                    </div>
                                    <p className="opacity-80">{result.pronunciation}</p>
                                </div>
                                <div>
                                    <p className="font-light text-base">{result.definition}</p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-lg">
                                    <p className="italic text-sm">"{result.example}"</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Synonyms:</p>
                                    <p className="text-sm opacity-90">{result.synonyms.join(', ')}</p>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            className="mt-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                           {wordExists ? (
                                <button disabled className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-success/10 text-success font-bold transition-colors">
                                    <CheckCircle2 size={20} />
                                    <span>In Your Vocabulary</span>
                                </button>
                            ) : addStatus === 'added' ? (
                                <button disabled className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-success/10 text-success font-bold transition-colors">
                                    <CheckCircle2 size={20} />
                                    <span>Added Successfully!</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleAddWord}
                                    disabled={addStatus === 'adding'}
                                    className="w-full bg-secondary text-white font-bold py-3 px-4 rounded-lg hover:bg-teal-500 transition-colors disabled:bg-secondary/50 flex items-center justify-center space-x-2"
                                >
                                    {addStatus === 'adding' ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Adding...</span>
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircle size={20} />
                                            <span>Add to My Vocabulary</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </motion.div>
                    </>
                )}
                </AnimatePresence>
                 {!isLoading && !result && !searched && (
                    <div className="text-center p-8 text-neutral-content">
                       <Mascot message="I can help you find definitions for any word. Just type it above!" />
                    </div>
                 )}
            </div>
        </div>
    );
};

export default DictionaryView;