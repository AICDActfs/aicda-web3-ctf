'use client';
import { useParams } from 'next/navigation';
import LabDetailClient from '@/components/LabDetailClient';

export default function Page() {
  const params = useParams();
  const slug = params?.slug as string;
  return <LabDetailClient slug={slug} />;
}
