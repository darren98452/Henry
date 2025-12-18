import { useState, useEffect, useCallback, useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import api from '../services/apiService';
import type { User } from '../types';

export const useSocial = () => {
    const { userData, addFriend, removeFriend } = useContext(UserContext);
    const [friends, setFriends] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const friendIds = userData?.friendIds || [];
    
    useEffect(() => {
        const fetchFriends = async () => {
            if (friendIds.length > 0) {
                setIsLoading(true);
                try {
                    const friendData = await api.getFriends(friendIds);
                    setFriends(friendData);
                } catch (e) {
                    console.error("Failed to fetch friends data", e);
                    setFriends([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setFriends([]); // Clear friends if list is empty
            }
        };
        // This is a naive way to re-fetch on change. A better implementation might use a listener.
      //  const friendIdsString = JSON.stringify(friendIds.sort());
        fetchFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(friendIds.sort())]);

    const isFriend = useCallback((id: string) => {
        return friendIds.includes(id);
    }, [friendIds]);

    return {
        friendIds: new Set(friendIds),
        friends,
        isLoadingFriends: isLoading,
        addFriend,
        removeFriend,
        isFriend,
    };
};

export type UseSocialReturn = ReturnType<typeof useSocial>;
