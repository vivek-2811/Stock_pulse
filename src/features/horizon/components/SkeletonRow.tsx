import React from 'react';

export const SkeletonRow: React.FC = () => {
  return (
    <tr className="animate-pulse bg-white/2 border-b border-border-glass">
      <td className="py-5 px-6">
        <div className="w-4.5 h-4.5 rounded bg-white/10" />
      </td>
      <td className="py-5 px-6">
        <div className="w-14 h-4 rounded bg-white/10" />
      </td>
      <td className="py-5 px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white/10" />
          <div className="flex-1 space-y-1.5">
            <div className="w-36 h-4 rounded bg-white/10" />
            <div className="w-20 h-3 rounded bg-white/5" />
          </div>
        </div>
      </td>
      <td className="py-5 px-6">
        <div className="w-16 h-5 rounded-full bg-white/10" />
      </td>
      <td className="py-5 px-6">
        <div className="w-24 h-4 rounded bg-white/10" />
      </td>
      <td className="py-5 px-6">
        <div className="w-16 h-5 rounded-full bg-white/10" />
      </td>
      <td className="py-5 px-6 text-right">
        <div className="w-16 h-4 rounded bg-white/10 ml-auto" />
      </td>
    </tr>
  );
};
export default SkeletonRow;
