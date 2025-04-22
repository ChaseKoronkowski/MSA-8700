'use client';

import React from 'react';
import Image from 'next/image';

interface PreferenceOptionProps {
  id: string;
  value: string;
  label: string;
  imageUrl: string;
  selected: boolean;
  onChange: (value: string, checked: boolean) => void;
  multiSelect?: boolean;
}

export default function PreferenceOption({
  id,
  value,
  label,
  imageUrl,
  selected,
  onChange,
  multiSelect = false
}: PreferenceOptionProps) {
  const handleClick = () => {
    onChange(value, !selected);
  };

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-lg border-2 cursor-pointer transition-all ${
        selected 
          ? 'border-blue-400 bg-blue-900' 
          : 'border-gray-700 hover:border-gray-500'
      }`}
      onClick={handleClick}
    >
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={imageUrl}
          alt={label}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Dark overlay for better text visibility */}
        <div className={`absolute inset-0 bg-black ${selected ? 'opacity-30' : 'opacity-50'} transition-opacity`}></div>
      </div>
      <div className="p-4 flex items-center justify-between bg-gray-900 text-white">
        <label htmlFor={id} className="cursor-pointer font-medium text-lg">
          {label}
        </label>
        <input
          type={multiSelect ? "checkbox" : "radio"}
          id={id}
          name={multiSelect ? undefined : id.split('-')[0]}
          value={value}
          checked={selected}
          onChange={(e) => onChange(value, e.target.checked)}
          className={`h-5 w-5 ${
            multiSelect ? 'rounded text-blue-500' : 'text-blue-500'
          }`}
        />
      </div>
    </div>
  );
} 