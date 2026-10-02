import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { housekeeping } from '@/lib/tournament/service';
import TrainerNav from '@/app/trainer/TrainerNav';
import NewTournament from './NewTournament';
import DeleteTournament from './DeleteTournament';

const STATUS_LABEL = { DRAFT: 'Entwurf', ACTIVE: 'läuft', FINISHED: 'beendet' } as const;

export default async function TournamentsPage() {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') redirect('/trainer');
  await housekeeping();

  const students = await db.user.findMany({
    where: { role: 'STUDENT', active: true },
    orderBy: { alias: 'asc' },
    select: { alias: true },
  });
  const list = await db.tournament.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 30,
    include: { players: { select: { id: true } }, roundsList: { select: { number: true } } },
  });

  return (
    <div>
      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h1>Turniere</h1>
        <p className='muted' style={{ marginBottom: 0 }}>
          Schweizer System für Brettturniere: Auslosung, Ergebnisse eintragen, Rangliste mit Feinwertung und große Ansicht für den Beamer.
        </p>
      </div>
      <TrainerNav active='tournaments' />

      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h2>Deine Turniere</h2>
        {list.length === 0 && <p className='muted'>Noch kein Turnier angelegt.</p>}
        <ul className='module-list'>
          {list.map((t) => (
            <li className='module-item' key={t.id}>
              <span>
                <b>{t.title}</b> · {t.players.length} Teilnehmer · Runde {t.roundsList.length}/{t.rounds} · {STATUS_LABEL[t.status]}
              </span>
              <span style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <Link href={`/trainer/tournaments/${t.id}`}>Öffnen</Link>
                <Link href={`/trainer/tournaments/${t.id}/beamer`} target='_blank'>Beamer</Link>
                <DeleteTournament id={t.id} title={t.title} />
              </span>
            </li>
          ))}
        </ul>
        <p className='muted' style={{ marginBottom: 0 }}>Beendete Turniere werden nach 90 Tagen automatisch gelöscht. Mit „Löschen“ kannst du jedes Turnier sofort entfernen.</p>
      </div>

      <NewTournament students={students.map((s) => s.alias)} />
    </div>
  );
}
