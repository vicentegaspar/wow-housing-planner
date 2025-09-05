import React, { useEffect } from 'react';
import type { Layout } from '../types';
import { Room } from './Room';
import { ROOM_DEFINITIONS } from '../constants';

// Make sure html2canvas and jspdf are declared if not using TS imports
declare const html2canvas: any;
declare const jspdf: { jsPDF: any };

interface ExportPreviewProps {
    isExporting: boolean;
    layout: Layout;
    onExportComplete: () => void;
    onError: (message: string) => void;
}

export const ExportPreview: React.FC<ExportPreviewProps> = ({ isExporting, layout, onExportComplete, onError }) => {

    useEffect(() => {
        if (isExporting) {
            const generatePdf = async () => {
                try {
                    const floorsToExport = Object.entries(layout.floors)
                        .map(([num, data]) => ({ floorNumber: parseInt(num, 10), rooms: data.rooms }))
                        .filter(floor => floor.rooms.length > 0)
                        .sort((a, b) => a.floorNumber - b.floorNumber);

                    if (floorsToExport.length === 0) {
                        onExportComplete();
                        return;
                    }

                    // Fix: Changed SVGElement to the more specific SVGSVGElement to access width and height.
                    const convertSvgToImage = (svgElement: SVGSVGElement): Promise<{ imgData: string; width: number; height: number; } | null> => {
                        return new Promise((resolve) => {
                            const svgString = new XMLSerializer().serializeToString(svgElement);
                            // Use unescape and encodeURIComponent to handle potential special characters in SVG, then btoa
                            const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;

                            const image = new Image();
                            
                            image.onload = () => {
                                const canvas = document.createElement('canvas');
                                const scale = 2; // Render at 2x for better quality
                                const svgWidth = svgElement.width.baseVal.value;
                                const svgHeight = svgElement.height.baseVal.value;
                                
                                canvas.width = svgWidth * scale;
                                canvas.height = svgHeight * scale;
                                
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                    // The SVG's background style won't be applied to the canvas directly, so we add it here.
                                    ctx.fillStyle = '#0d1017'; // Matches --color-bg-dark
                                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                                    ctx.scale(scale, scale);
                                    ctx.drawImage(image, 0, 0, svgWidth, svgHeight);
                                    
                                    const imgData = canvas.toDataURL('image/png');
                                    resolve({
                                        imgData,
                                        width: canvas.width,
                                        height: canvas.height,
                                    });
                                } else {
                                    resolve(null);
                                }
                            };

                            image.onerror = (err) => {
                                console.error("Failed to load SVG as image for PDF export:", err);
                                resolve(null);
                            };
                            
                            image.src = svgDataUrl;
                        });
                    };
                    
                    const floorImages = await Promise.all(
                        floorsToExport.map(async ({ floorNumber }) => {
                            // Fix: Correctly cast the result of getElementById to SVGSVGElement.
                            const svgElement = document.getElementById(`export-floor-${floorNumber}`) as unknown as SVGSVGElement | null;
                            if (!svgElement) return null;
                            return convertSvgToImage(svgElement);
                        })
                    );

                    const validImages = floorImages.filter(img => img !== null) as { imgData: string; width: number; height: number; }[];

                    if (validImages.length > 0) {
                        const firstImage = validImages[0];
                        const { jsPDF } = jspdf;
                        const pdf = new jsPDF({
                            orientation: firstImage.width > firstImage.height ? 'l' : 'p',
                            unit: 'px',
                            format: [firstImage.width, firstImage.height]
                        });

                        pdf.addImage(firstImage.imgData, 'PNG', 0, 0, firstImage.width, firstImage.height);

                        for (let i = 1; i < validImages.length; i++) {
                            const image = validImages[i];
                            pdf.addPage([image.width, image.height], image.width > image.height ? 'l' : 'p');
                            pdf.addImage(image.imgData, 'PNG', 0, 0, image.width, image.height);
                        }

                        pdf.save('WoW-Layout.pdf');
                    } else if (floorsToExport.length > 0) {
                        // This case means we had floors but couldn't render any of them.
                        throw new Error("Could not render any floors. SVG conversion might have failed.");
                    }
                } catch (error) {
                    console.error("Failed to generate multi-page PDF:", error);
                    onError("An error occurred while exporting the PDF. The layout might be too complex or contain unsupported elements.");
                } finally {
                    onExportComplete();
                }
            };

            // Increased timeout to ensure SVGs are fully rendered in the DOM before we try to access them.
            setTimeout(generatePdf, 500);
        }
    }, [isExporting, layout, onExportComplete, onError]);

    if (!isExporting) {
        return null;
    }

    // This div is rendered off-screen
    return (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1 }}>
            {Object.entries(layout.floors).map(([floorNumber, floorData]) => {
                if (floorData.rooms.length === 0) return null;

                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                floorData.rooms.forEach(room => {
                    const def = ROOM_DEFINITIONS[room.shape];
                    const centerX = room.x + def.width / 2;
                    const centerY = room.y + def.height / 2;
                    const corners = [
                        { x: room.x, y: room.y },
                        { x: room.x + def.width, y: room.y },
                        { x: room.x, y: room.y + def.height },
                        { x: room.x + def.width, y: room.y + def.height },
                    ];
                    corners.forEach(corner => {
                        const rad = (room.rotation * Math.PI) / 180;
                        const cos = Math.cos(rad);
                        const sin = Math.sin(rad);
                        const translatedX = corner.x - centerX;
                        const translatedY = corner.y - centerY;
                        const rotatedX = translatedX * cos - translatedY * sin + centerX;
                        const rotatedY = translatedX * sin + translatedY * cos + centerY;

                        minX = Math.min(minX, rotatedX);
                        minY = Math.min(minY, rotatedY);
                        maxX = Math.max(maxX, rotatedX);
                        maxY = Math.max(maxY, rotatedY);
                    });
                });

                const padding = 50;
                const exportWidth = (maxX - minX) + padding * 2;
                const exportHeight = (maxY - minY) + padding * 2;

                return (
                    <svg
                        key={floorNumber}
                        id={`export-floor-${floorNumber}`}
                        width={exportWidth}
                        height={exportHeight}
                        viewBox={`${minX - padding} ${minY - padding} ${exportWidth} ${exportHeight}`}
                        style={{ backgroundColor: 'var(--color-bg-dark)' }}
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {floorData.rooms.map(room => (
                            <Room
                                key={room.id}
                                room={room}
                                sectors={layout.sectors}
                                isExporting={true}
                                className="fill-cyan-900/50 stroke-cyan-400 stroke-2"
                            />
                        ))}
                    </svg>
                );
            })}
        </div>
    );
};
