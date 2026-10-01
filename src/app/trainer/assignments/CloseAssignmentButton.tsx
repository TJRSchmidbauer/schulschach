'use client';

import { useRouter } from 'next/navigation';

export default function CloseAssignmentButton({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();

  async function toggleActive() {
    await fetch(`/api/trainer/assignments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    });
    router.refresh();
  }

  return (
    <button type="button" className="btn btn-secondary" style={{ width: 'auto', marginTop: '0.6rem', padding: '0.5rem 1rem' }} onClick={() => void toggleActive()}>
      {active ? 'Beenden' : 'Wieder aktivieren'}
    </button>
  );
}
