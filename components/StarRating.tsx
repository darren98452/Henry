
import React from 'react';

interface StarRatingProps {
  score: number;
  total: number;
}

const Star: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="36"
    height="36"
    viewBox="0 0 24 24"
    fill={filled ? "#f59e0b" : "#e5e7eb"}
    stroke={filled ? "#f59e0b" : "#d1d5db"}
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-star transition-colors duration-300"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const StarRating: React.FC<StarRatingProps> = ({ score, total }) => {
  const percentage = total > 0 ? (score / total) * 100 : 0;
  let filledStars = 0;
  if (percentage >= 90) {
    filledStars = 3;
  } else if (percentage >= 60) {
    filledStars = 2;
  } else if (percentage >= 30) {
    filledStars = 1;
  }

  return (
    <div className="flex justify-center space-x-2">
      <Star filled={filledStars >= 1} />
      <Star filled={filledStars >= 2} />
      <Star filled={filledStars >= 3} />
    </div>
  );
};

export default StarRating;
