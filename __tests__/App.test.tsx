

/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { useLayoutManager } from '../components/hooks';
import { Layout, RoomShape, Sector } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key:string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock utility functions
const mockSetShowStartupModal = jest.fn();

describe('useLayoutManager Hook', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockSetShowStartupModal.mockClear();
    // Mock window.confirm to always be true for import tests
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('should initialize with a default layout and show startup modal if no saved data', () => {
    const { result } = renderHook(() => useLayoutManager(false, mockSetShowStartupModal));
    
    expect(result.current.layout.floors).toEqual({ 1: { rooms: [] } });
    expect(result.current.layout.sectors).toEqual({});
    expect(result.current.currentFloor).toBe(1);
    expect(mockSetShowStartupModal).toHaveBeenCalledWith(true);
  });
  
  it('should load a layout from localStorage if it exists', () => {
    const savedLayout: Layout = {
      floors: { 1: { rooms: [{ id: '1', shape: RoomShape.SQUARE, x: 0, y: 0, rotation: 0 }] } },
      sectors: { 'test': { id: 'test', name: 'Test', color: '#fff', description: '' } },
    };
    localStorageMock.setItem('wow-house-layout', JSON.stringify(savedLayout));
    
    const { result } = renderHook(() => useLayoutManager(false, mockSetShowStartupModal));

    expect(result.current.layout).toEqual(savedLayout);
    // Fix: Correct typo from mockSetShowStartupTModal to mockSetShowStartupModal
    expect(mockSetShowStartupModal).not.toHaveBeenCalled();
  });

  it('should handle floor changes correctly', () => {
    const { result } = renderHook(() => useLayoutManager(false, mockSetShowStartupModal));
    
    act(() => {
      result.current.handleFloorChange('up');
    });
    expect(result.current.currentFloor).toBe(2);

    act(() => {
      result.current.handleFloorChange('down');
    });
    expect(result.current.currentFloor).toBe(1);
    
    // Should not go below floor 1
    act(() => {
      result.current.handleFloorChange('down');
    });
    expect(result.current.currentFloor).toBe(1);
  });
  
  it('should save and delete sectors', () => {
    const { result } = renderHook(() => useLayoutManager(false, mockSetShowStartupModal));
    const newSector: Sector = { id: 's1', name: 'Living Area', color: '#1a3c8c', description: 'Main area' };

    act(() => {
      result.current.handleSaveSector(newSector);
    });
    expect(result.current.layout.sectors['s1']).toEqual(newSector);
    
    // Add a room with the sector to test cascading delete
     act(() => {
        result.current.setLayout(prev => ({
            ...prev,
            floors: { 1: { rooms: [{ id: 'r1', shape: RoomShape.SQUARE, x: 0, y: 0, rotation: 0, sectorId: 's1'}] } }
        }))
    });
    expect(result.current.layout.floors[1].rooms[0].sectorId).toBe('s1');

    act(() => {
      result.current.handleDeleteSector('s1');
    });
    expect(result.current.layout.sectors['s1']).toBeUndefined();
    // Check if the room's sectorId was removed
    expect(result.current.layout.floors[1].rooms[0].sectorId).toBeUndefined();
  });

  it('should support undo and redo', () => {
    const { result } = renderHook(() => useLayoutManager(false, mockSetShowStartupModal));
    
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);

    const newSector: Sector = { id: 's1', name: 'Test', color: '#fff', description: '' };
    act(() => {
      result.current.handleSaveSector(newSector);
    });
    
    expect(result.current.layout.sectors['s1']).toBeDefined();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    act(() => {
      result.current.undo();
    });

    expect(result.current.layout.sectors['s1']).toBeUndefined();
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.redo();
    });

    expect(result.current.layout.sectors['s1']).toBeDefined();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });
  
  it('should correctly import a layout from a valid JSON string', () => {
    const { result } = renderHook(() => useLayoutManager(false, mockSetShowStartupModal));
    const newLayout: Layout = {
      floors: {
        2: { rooms: [{ id: 'imported', shape: RoomShape.SQUARE, x: 100, y: 100, rotation: 0 }], name: 'Second Floor' },
      },
      sectors: { 'imported': { id: 'imported', name: 'Import', color: '#000', description: '' } },
    };
    const jsonString = JSON.stringify(newLayout);

    let success = false;
    act(() => {
      success = result.current.handleImportLayout(jsonString);
    });

    expect(success).toBe(true);
    expect(result.current.layout).toEqual(newLayout);
    // Should switch to the first available floor in the imported layout
    expect(result.current.currentFloor).toBe(2);
  });
  
  it('should correctly import a layout from a valid Base64 string', () => {
    const { result } = renderHook(() => useLayoutManager(false, mockSetShowStartupModal));
    const newLayout: Layout = {
      floors: { 1: { rooms: [] } },
      sectors: { 'imported': { id: 'imported', name: 'Base64 Import', color: '#000', description: '' } },
    };
    const jsonString = JSON.stringify(newLayout);
    const base64String = btoa(unescape(encodeURIComponent(jsonString)));

    let success = false;
    act(() => {
      success = result.current.handleImportLayout(base64String);
    });

    expect(success).toBe(true);
    expect(result.current.layout).toEqual(newLayout);
  });
  
  it('should fail to import from an invalid string', () => {
    const { result } = renderHook(() => useLayoutManager(false, mockSetShowStartupModal));
    const invalidString = "this is not a valid layout";

    let success = false;
    act(() => {
      success = result.current.handleImportLayout(invalidString);
    });

    expect(success).toBe(false);
    // Layout should remain unchanged
    expect(result.current.layout.sectors).toEqual({});
  });
});
