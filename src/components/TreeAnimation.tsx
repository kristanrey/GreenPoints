import React from "react";
import "./TreeAnimation.css";

interface TreeAnimationProps {
  treesPlanted: number;
  greenpoints: number;
}

const TreeAnimation: React.FC<TreeAnimationProps> = ({ treesPlanted, greenpoints }) => {
  const trunkHeight = Math.min(treesPlanted * 10, 200); // max 200px
  const maxLeaves = 20;
  const leavesCount = Math.min(Math.floor(greenpoints / 5), maxLeaves);

  return (
    <svg width="100" height="250" className="tree-svg">
      {/* Trunk */}
      <rect
        x="45"
        y={250 - trunkHeight}
        width="10"
        height={trunkHeight}
        fill="#8B4513"
        rx="3"
      >
        <animate
          attributeName="height"
          from="0"
          to={trunkHeight}
          dur="1s"
          fill="freeze"
        />
      </rect>

      {/* Leaves */}
      {Array.from({ length: leavesCount }).map((_, index) => {
        const angle = (index / leavesCount) * Math.PI - Math.PI / 2;
        const radius = Math.random() * 20 + 10;
        const cx = 50 + radius * Math.cos(angle);
        const cy = 250 - trunkHeight - radius * Math.sin(angle);
        return (
          <circle
            key={index}
            cx={cx}
            cy={cy}
            r="5"
            fill="#00A86B"
            style={{ opacity: 0, animation: `fadeIn 1s forwards ${index * 0.1}s` }}
          />
        );
      })}
    </svg>
  );
};

export default TreeAnimation;
