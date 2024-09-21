import React from 'react';
import Link from 'next/link';

const TagComponent = ({ tags }) => {
  // 개선된 색상 스키마
  const colorScheme = {
    purple: '#8A2BE2', // 선명한 보라색
    orange: '#FF7F50', // 산호색
    brown: '#A0522D', // 시에나
    yellow: '#FFD700', // 골드
    red: '#DC143C', // 크림슨
    green: '#2E8B57', // 바다 녹색
    blue: '#4169E1', // 로얄 블루
    gray: '#708090', // 슬레이트 그레이
    default: '#607D8B', // 블루 그레이
    pink: '#FF69B4', // 핫 핑크
  };

  // 배경색에 따라 텍스트 색상을 결정하는 함수
  const getTextColor = bgColor => {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#FFFFFF';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      {tags.map(tag => {
        const bgColor = colorScheme[tag.color] || colorScheme.default;
        const textColor = getTextColor(bgColor);
        return (
          <Link
            key={tag.id}
            href={`/tag/${tag.name}`}
            style={{
              backgroundColor: bgColor,
              color: textColor,
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '500',
              textDecoration: 'none',
              transition: 'opacity 0.3s ease-in-out',
            }}
          >
            # {tag.name}
          </Link>
        );
      })}
    </div>
  );
};

export default TagComponent;
