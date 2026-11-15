'use client';
import { createContext, useContext } from 'react';
import type { ChartAsset, ChartBlock } from '@/lib/chartTypes';

const ChartData = createContext<{ blocks: ChartBlock[]; archives: ChartAsset[] } | null>(null);
export function useChartData() { return useContext(ChartData); }

export default function ChartDataProvider({ initialBlocks, archives, children }: { initialBlocks: ChartBlock[]; archives: ChartAsset[]; children: React.ReactNode }) {
  return <ChartData.Provider value={{ blocks: initialBlocks, archives }}>{children}</ChartData.Provider>;
}
