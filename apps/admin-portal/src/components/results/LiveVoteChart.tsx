'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ResultItem {
  candidateId: string;
  candidateName: string;
  party: string;
  votes: number;
  percentage: number;
}

export function LiveVoteChart({ results }: { results: ResultItem[] }) {
  const data = {
    labels: results.map((r) => `${r.candidateName} (${r.party})`),
    datasets: [
      {
        label: 'Votes Received',
        data: results.map((r) => r.votes),
        backgroundColor: [
          'rgba(2, 132, 199, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: [
          '#0284c7',
          '#10b981',
          '#a855f7',
          '#f59e0b',
        ],
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `Votes: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' },
      },
    },
  };

  return (
    <div className="h-72 w-full">
      <Bar data={data} options={options} />
    </div>
  );
}
