
import React, { useState, useMemo } from 'react';
import type { RoomInstance, Sector } from '../types';
import { ROOM_DEFINITIONS } from '../constants';

interface RoomProps {
    room: RoomInstance;
    sectors: Record<string, Sector>;
    className?: string;
    onPointerDown?: (e: React.PointerEvent) => void;
    onClick?: (e: React.MouseEvent) => void;
    isSelected?: boolean;
    isExporting?: boolean;
    isAssigning?: boolean;
    assigningColor?: string | null;
    isGhost?: boolean;
    [key: string]: any; // Allow other props like data-id
}

export const Room: React.FC<RoomProps> = React.memo(({ room, sectors, className, onPointerDown, onClick, isSelected, isExporting, isAssigning, assigningColor, isGhost, ...rest }) => {
    const [isHovered, setIsHovered] = useState(false);
    const definition = ROOM_DEFINITIONS[room.shape];
    if (!definition) return null;

    const { component: RoomComponent, nodes } = definition;
    const roomCenter = { x: definition.width / 2, y: definition.height / 2 };

    const transform = `translate(${room.x}, ${room.y}) rotate(${room.rotation}, ${roomCenter.x}, ${roomCenter.y})`;

    const sector = room.sectorId ? sectors[room.sectorId] : null;

    const finalStyle = useMemo(() => {
        if (isGhost) {
            return { fill: 'rgba(255, 255, 255, 0.05)', cursor: 'default' };
        }

        let fill = 'rgba(17, 94, 112, 0.5)'; // default fill: cyan-900/50
        
        if (isHovered && isAssigning && assigningColor) {
             fill = assigningColor;
        } else if (sector) {
            fill = sector.color;
        } else if (isHovered && !isAssigning) {
            fill = 'rgba(6, 78, 99, 0.6)'; // default hover fill for select tool
        }

        return { fill, cursor: isAssigning ? 'pointer' : 'move' };
    }, [sector, isHovered, isAssigning, assigningColor, isGhost]);
    
    const finalClassName = useMemo(() => {
        if (isGhost) {
            return "stroke-gray-600 stroke-1";
        }
        if (isSelected) {
            return "stroke-yellow-400 stroke-2";
        }
        return className;
    }, [isSelected, className, isGhost]);

    const nodeElements = useMemo(() => {
        return nodes.map((node, index) => (
            <circle
                key={index}
                cx={node.x}
                cy={node.y}
                r={5}
                className="fill-yellow-400 stroke-gray-900 pointer-events-none"
            />
        ));
    }, [nodes]);

    const showLabel = sector && !isGhost;
    // Calculate a font size that won't be taller than 35% of the room's height, with a max of 18px.
    const labelFontSize = Math.min(definition.height * 0.35, 18);

    return (
        <g
            transform={transform}
            onPointerDown={isGhost ? undefined : onPointerDown}
            onClick={isGhost ? undefined : onClick}
            onMouseEnter={isGhost ? undefined : () => setIsHovered(true)}
            onMouseLeave={isGhost ? undefined : () => setIsHovered(false)}
            style={{ cursor: finalStyle.cursor, pointerEvents: isGhost ? 'none' : 'auto' }}
            {...rest}
        >
            <title>{isGhost ? '' : `${room.shape} at (${Math.round(room.x)}, ${Math.round(room.y)})`}</title>
            <RoomComponent className={finalClassName} style={{fill: finalStyle.fill, transition: 'fill 0.15s ease-in-out'}}/>
            {(isHovered && !isExporting && !isSelected && !isAssigning && !isGhost) && nodeElements}
            {showLabel && (
                <text
                    x={roomCenter.x}
                    y={roomCenter.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={labelFontSize}
                    fontWeight="bold"
                    fill="white"
                    stroke="black"
                    strokeWidth="0.5"
                    paintOrder="stroke"
                    className="pointer-events-none font-sans"
                    style={{ userSelect: 'none' }}
                    // Apply inverse rotation to keep the text upright
                    transform={`rotate(${-room.rotation}, ${roomCenter.x}, ${roomCenter.y})`}
                    // Squeeze text to fit 90% of the room's width
                    textLength={definition.width * 0.9}
                    lengthAdjust="spacingAndGlyphs"
                >
                    {sector.name}
                </text>
            )}
        </g>
    );
});
