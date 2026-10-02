import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import ImportStudents from './ImportStudents';

export const dynamic = 'force-dynamic';

export default async function ImportPage() {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') redirect('/trainer');
  return (
    <div>
      <p>
        <Link href='/trainer/settings'>← Zu den Einstellungen</Link>
      </p>
      <ImportStudents />
    </div>
  );
}
