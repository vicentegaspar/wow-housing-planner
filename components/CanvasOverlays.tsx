import React from 'react';

interface CanvasOverlaysProps {
    totalArea: number;
    areaLimit: number;
    floorName: string;
}

export const CanvasOverlays: React.FC<CanvasOverlaysProps> = ({ totalArea, areaLimit, floorName }) => {
    const areaPercentage = (totalArea / areaLimit) * 100;
    const isOverLimit = totalArea > areaLimit;

    return (
        <div className="absolute inset-0 pointer-events-none p-4 flex justify-end items-start text-white" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            <div className="bg-black/50 px-4 py-2 rounded-lg border border-gray-600/50 backdrop-blur-sm min-w-[300px] flex flex-col gap-2">
                {/* Total Area Section */}
                <div>
                    <div className="flex justify-between items-baseline gap-3">
                        <h3 className="font-title text-lg text-yellow-400">Total Area</h3>
                        <p className={`font-mono text-lg ${isOverLimit ? 'text-red-400' : 'text-white'}`}>
                            {totalArea.toFixed(2)} / {areaLimit} m²
                        </p>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                        <div
                            className={`h-1.5 rounded-full ${isOverLimit ? 'bg-red-500' : 'bg-yellow-500'}`}
                            style={{ width: `${Math.min(100, areaPercentage)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gray-600/50"></div>
                
                {/* Current Floor Section */}
                <div>
                    <div className="flex justify-between items-baseline gap-3">
                        <h3 className="font-title text-lg text-yellow-400">Current Floor</h3>
                        <p className="text-xl font-bold truncate">{floorName}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};