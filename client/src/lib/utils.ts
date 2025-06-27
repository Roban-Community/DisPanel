import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export function formatMemory(mb: number): string {
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)}GB`;
  }
  return `${mb}MB`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'online':
      return 'text-discord-green';
    case 'idle':
      return 'text-discord-yellow';
    case 'dnd':
      return 'text-discord-red';
    case 'invisible':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
}

export function getStatusEmoji(status: string): string {
  switch (status) {
    case 'online':
      return '🟢';
    case 'idle':
      return '🟡';
    case 'dnd':
      return '🔴';
    case 'invisible':
      return '⚫';
    default:
      return '⚫';
  }
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function generateGuildIconFallback(guildName: string): string {
  const words = guildName.split(' ');
  if (words.length >= 2) {
    return words[0][0].toUpperCase() + words[1][0].toUpperCase();
  }
  return guildName.substring(0, 2).toUpperCase();
}
